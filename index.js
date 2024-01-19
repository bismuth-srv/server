const clc = require('cli-color');
const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const debug = process.env.DEBUG;
const port = process.env.PORT;

if (debug == "true") {
    console.log (clc.yellow("Debugging is enabled! This is not recommended for production environments!"));
}

if (port == null || port == "") {
    console.error("Please set a port in the .env");
    process.exit(342);
}

let db = new sqlite3.Database('database.db', (err) => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }
        console.log(clc.green('Successfully connected to the SQLite database!'));
});

app.use((req, res, next) => {
    console.log(`Request received from ${req.ip}:`, req.body);
    next();
});

app.get('/', (req, res) => {
    res.send("This is a placeholder until I actually make a WebUI to edit your cute Pokemon!");
});

app.get('/api/online', (req, res) => {
    res.send("Hello! I'm a Bismuth server running on port " + port + "!");
});

app.get('/api/register', (req, res) => {
    const { register } = req.query;
    
    if (register === '' || register === null) {
        res.send('Womp womp, there\'s no data in the registration request!\nCheck your Sulfur client!');
    } else {
        res.status(418).send('I\'m a teapot');
    }
});

app.get('/api/login', (req, res) => {
    const { login } = req.query;
    
    if (login === '' || login === null) {
        res.send('Womp womp, there\'s no data in the login request!\nCheck your Sulfur client!');
    } else {
        res.status(418).send('I\'m a teapot');
    }
});

app.get('/api/testfilepayloadsender', (req, res) => {
    let payload = req.query.payload;
    if (payload == "testload") {
        res.sendFile("payload");
    } 
    else {
        res.sendFile("payload2");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
