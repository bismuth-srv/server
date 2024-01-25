const clc = require('cli-color');
const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const debug = process.env.DEBUG;
const port = process.env.PORT;
const database = process.env.DB;

if (debug !== "true" && debug !== "false") {
    console.log (clc.yellow("Confused on your debugging mode, please set it to either true or false in the .env file! (value is debug=\'false\' by default)"));
}

if (debug == "true") {
    console.log (clc.yellow("Debugging is enabled! This is not recommended for production environments!"));
}

if (port == null || port == "") {
    console.error("Please set a port in the .env (value is port=\'4444\' by default)");
    process.exit(342);
}

if (database == null || database == "") {
    console.error("Please set a database.db in the .env (value is db=\'main.db\' by default)");
    process.exit(343);
}

let db = new sqlite3.Database(database, (err) => {
    if (err) {
        console.error(err.message);
        process.exit(352);
    }
    console.log(clc.green('Connected to the SQLite3 database ' + database + '!'));
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        pwdhash TEXT NOT NULL UNIQUE
    )`, (err) => {
        if (err) {
            console.error((err.message));
            process.exit(353);
        } else {
            console.log("User table created!");
        }});
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        pwdhash TEXT NOT NULL UNIQUE
    )`, (err) => {
        if (err) {
            console.error((err.message));
            process.exit(353);
        } else {
            console.log("System table created!");
        }
    });
});

db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
        console.error(err.message);
        process.exit(355);
    } else if (!row) {
        console.error("Data corruption error: Table 'users' does not exist in the database!");
        process.exit(356);
    }
});

app.use((req, res, next) => {
    if (debug == "true") {
        console.log(`Request received from ${req.ip}:`, req.body);
        next();
    }
});

app.get('/', (req, res) => {
    res.json({message:'This is a placeholder until I actually make a WebUI to edit your cute Pokémon!'});
});

app.get('/api/online', (req, res) => {
    res.json({message: 'Hello! I\'m a Bismuth server running on port ' + port + '!'});
});

app.get('/api/register', (req, res) => {
    const { username } = req.query;
    const { email } = req.query;
    const { pwdhash } = req.query;
    
    if (username === '' || username === null) {
        res.status(405).json({message:'Womp womp, there\'s no data in the registration request!\nCheck your Sulfur client!'});
    } else if (username !== '' || username !== null && email === '' || email === null && pwdhash !== '' && pwdhash.length === 256) {
        res.status(200).json({message:'Account created without an email! (Here be dragons!)'});
    } else if (username !== '' || username !== null && email !== '' || email !== null && pwdhash !== '' && pwdhash.length === 256) {
        res.status(200).json({message:'Account created!'});
    } else {
        res.status(405).json({message:'I\'m boutta do you like I did the last guy who tried to register without any registration data. (405 Method Not Allowed)'});
    }
});

app.get('/api/login', (req, res) => {
    const { login } = req.query;
    
    if (login === '' || login === null) {
        res.status(405).send('Womp womp, there\'s no data in the login request!\nCheck your Sulfur client!');
    } else {
        res.status(405).send('I\'m boutta do you like I did the last guy who tried to login without any login data. (405 Method Not Allowed)');
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