const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Invalid username or password" });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);


passport.serializeUser((user, done) => {
    console.log("serializing user")
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("deserialize")
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});