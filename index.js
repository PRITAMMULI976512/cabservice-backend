// import './src/config/PassportConfig';
const PassportConfig = require('./src/config/PassportConfig');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const dotenv = require('dotenv');
const DBconnect = require('./src/config/DBConnect');

dotenv.config();

DBconnect();  
const app = express();

// middleware
const corsOption = {
    origin: ['http://localhost:3000'],
    credentials: true
}

app.use(cors())
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb', extended: true}));
app.use(session({
    secret: process.env.SECRET || 'my-secret-key',
    resave: false,
    saveUninitialized: false, 
    cookie: {
        maxAge: 60000 * 60,
    }
}))

app.use(passport.initialize());
app.use(passport.session());

//Royurtes
app.use("/api/auth", require("./src/Routes/AuthRoutes"));

// listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});