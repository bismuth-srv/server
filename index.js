const clc = require('cli-color');
const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const bismuth = require('./package.json').name;
const version = require('./package.json').version;
const debug = process.env.DEBUG;
const port = process.env.PORT;
const database = process.env.DB;

if (debug !== "true" && debug !== "false") {
    console.log (clc.yellow("Confused on your debugging mode, please set it to either true or false in the .env file! (value is debug=\'false\' by default)"));
    console.log (clc.yellow("We'll assume it's false for now..."));
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

if (fs.existsSync("./" + database)) {
    let db = new sqlite3.Database(database, (err) => {
        if (err) {
            console.error(err.message);
            process.exit(351);
        }
        console.log(clc.green('Connected to the SQLite3 database ' + database + '!'));
    });
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err) {
            console.error(err.message);
            process.exit(352);
        } else if (!row) {
            console.error("Data corruption error: Table 'users' does not exist in the database!");
            process.exit(353);
        }
    });
} else {
    let db = new sqlite3.Database(database, (err) => {
        if (err) {
            console.error(err.message);
            process.exit(354);
        }
        console.log(clc.green('Created SQLite3 database ' + database + '!'));
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY NOT NULL UNIQUE,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            pwdhash TEXT NOT NULL UNIQUE
        )`, (err) => {
            if (err) {
                console.error((err.message));
                process.exit(355);
            } else {
                console.log(clc.green("User table created!"));
            }
        });
    });
}

app.use((req, res, next) => {
    if (debug == "true") {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipv4 = ip.includes(':') ? ip.split(':').pop() : ip;
        console.log(`Request received from ${ipv4}:`, req.query, "in", req.path, "via a", req.method, "request with this user-agent:", req.headers['user-agent']);
        next();
    }
});

app.get('/', (req, res) => {
    const userAgent = req.headers['user-agent'];
    const isMobile = /Mobile/i.test(userAgent);

    if (isMobile) {
        res.sendFile(path.join(__dirname + '/mobile.html'));
    } else {
        res.sendFile(path.join(__dirname + '/index.html'));
    }
});

app.post('/api/online', (req, res) => {
    res.json({message: 'Hello! I\'m a Bismuth server running on port ' + port + '!'});
});

app.post('/api/logout', (req, res) => {

});

app.post('/api/resetpassword', (req, res) => {

});

app.post('/api/userinfo', (req, res) => {

});

app.post('/api/getbox', (req, res) => {

});

app.post('/api/register', (req, res) => {
    const { username, email, pwdhash } = req.query;
    
    if (!username && !email && !pwdhash) {
        res.status(405).json({message: 'Womp womp, there\'s no data in the registration request!', message2: 'Check your Sulfur client!'});
    } else if (!email && !pwdhash) {
        res.status(405).json({message: 'Please provide registration info!'});
    } else if (email && pwdhash && pwdhash.length === 256) {
        res.status(200).json({message: 'Account created!'});
    } else {
        res.status(405).json({message: 'How did we get here? (405 Method Not Allowed)'});
    }
});

app.post('/api/login', (req, res) => {
    const { login } = req.query;
    
    if (login === '' || login === null) {
        res.status(405).json({message:'Womp womp, there\'s no data in the login request!', message2: 'Check your Sulfur client!'});
    } else {
        res.status(405).json({message:'How did we get here? (405 Method Not Allowed)'});
    }
});

app.post('/serverconfig', (req, res) => {
    const { client } = req.query;
    const { clientversion } = req.query;

    if (client === 'sulfur' && clientversion === version) {
        res.status(200).json({"name": bismuth, "version": version, "port": port, "debug": debug})
    } else if (client === 'sulfur' && clientversion !== version) {
        res.status(200).json({message: "You're using the wrong version of Sulfur! Please update to the correct version to use this server!", clientver: clientversion, serverver: version})
    } else {
        res.status(405).json({message: "You're not using Sulfur! You might be lost, however, that's okay!", message2: "Go to the root directory of this page and you'll find the Bismuth web panel!"})
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

const githubtester = process.env.GITHUBTESTER;
if (githubtester === "true") {
    console.log(clc.green("Successfully finished testing, exiting..."));
    process.exit(0);
} else if (githubtester === "false" || githubtester === null || githubtester === ""){
    return;
}