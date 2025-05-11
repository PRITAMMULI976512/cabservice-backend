const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");

const router = express.Router();

// register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashpass = bcrypt.hashSync(password, 10);

    const olduser = await User.findOne({ username });

    if (olduser) {
      return res.status(400).send({ error: "User already exists" });
    }
    const newUser = new User({
      username,
      password: hashpass,
      isMFAActive: false,
    });

    console.log("new user", newUser);
    const user = newUser.save();
    res.send(newUser);
  } catch (error) {
    res
      .status(500)
      .send({ error: "Internal Server Error", message: error.message });
  }
});

// login
router.post("/login", passport.authenticate("local"), async (req, res) => {
  console.log("req.user", req.user);

  res.status(200).json({
    message: "Login successful",
    id: req.user._id,
    username: req.user.username,
    isMFAActive: req.user.isMFAActive,
  });
});

// Auth status
router.get("/authstatus", (req, res) => {
  if (req.user) {
    res.status(200).json({
      id: req.user._id,
      username: req.user.username,
      isMFAActive: req.user.isMFAActive,
    });
  } else {
    res.status(401).send({ error: "Unauthorized User" });
  }
});
// logout
router.post("/logout", (req, res) => {
  if (!req.user) {
    res.status(401).send({ error: "Unauthorized User" });
  }
  req.logout((err) => {
    if (err) {
      return res.status(400).send({ error: "User not logged in" });
    }
    res.status(200).send({ message: "Logout successful" });
  });
});

// 2FA Setrpu
router.post(
  "/2fa/setup",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send({ error: "Unauthorized" });
  },
  async (req, res) => {
    try {
      console.log("req.user", req.user);

      const user = req.user;

      let secret = speakeasy.generateSecret();
      console.log("secret", secret);
      user.twoFactorSecret = secret.base32;

      user.isMFAActive = true;
      await user.save();

      const url = speakeasy.otpauthURL({
        secret: secret.base32,
        label: `${req.user.username}`,
        issuer: "www.dipeshmalvia.com",
        encoding: "base32",
      });

      const qrlImage = await qrcode.toDataURL(url);
      console.log("qrlImage", qrlImage);
      console.log("url", url);

      res.status(200).json({
        message: "2FA setup successful",
        qrlImage,
        secret: secret.base32,
      });
      // res.json({ message: "2FA setup successful" });
    } catch (error) {
      res
        .status(500)
        .send({ error: "Error in 2FA setup", message: error.message });
    } 
  }
);

// 2FA Verify
let JWT_SECRET = "secret";
router.post(
  "/2fa/verify",
  async (req, res, next) => {
    if (req.isAuthenticated) {
      return next();
    }
    res.status(401).send({ error: "Unauthorized" });
  },
  async (req, res) => {
    const { token } = req.body;
 
    const user = req.user;

    console.log("user", user);
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    console.log("verified", verified);

    console.log("token", token);
    if (verified) {
      const token = jwt.sign(
        { username: user.username },
        JWT_SECRET,
        { expiresIn: "1hr" }
      );

      res
        .status(200)
        .json({ message: "2FA verification successful", token: token });
    } else {
      res.status(400).send({ error: "2FA verification failed" });
    }
  }
);

// reset rout
router.post(
  "/2fa/reset",
  async (req, res, next) => {
    if (req.isAuthenticated) {
      return next();
    }
    res.status(401).send({ error: "Unauthorized" });
  },
  async (req, res) => {
    try {
      const user = req.user;
      user.isMFAActive = false;
      user.twoFactorSecret = "";
      await user.save();
      res.status(200).json({ message: "2FA reset successful" });
    } catch (error) {
      res
        .status(500)
        .send({ error: "Error in 2FA setup reset", message: error.message });
    }
  }
);
module.exports = router;
