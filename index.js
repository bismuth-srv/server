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
            username TEXT PRIMARY KEY NOT NULL UNIQUE,
            pwdhash TEXT NOT NULL,
            salt TEXT NOT NULL,
            accesstoken TEXT
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
    let db = openDB();
    db.run('UPDATE users SET accesstoken = ? WHERE accesstoken = ?', ['', req.cookies['accesstoken']], (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
            closeDB(db);
        } else {
            res.status(200).send('Logged out');
            closeDB(db);
        }
    });
});

app.post('/api/resetpassword', (req, res) => {

});

app.post('/api/userinfo', (req, res) => {

});

app.post('/api/getbox', (req, res) => {

});

app.post('/api/admin/createuser', (req, res) => {
    const password = req.body.password;
    const username = req.body.username;
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        } else {
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal server error');
                    return;
                }
                let db = openDB();
                try {
                    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                        if (err) {
                            console.error(err.message);
                            res.status(500).send('Internal server error');
                        } else if (row) {
                            res.status(409).send('User already exists');
                        } else {
                            db.run('INSERT INTO users (username, pwdhash, salt, accesstoken) VALUES (?, ?, ?, ?)', [username, hash, salt, null], (err) => {
                                if (err) {
                                    console.error(err.message);
                                    res.status(500).send('Internal server error');
                                } else {
                                    res.status(200).send('User created successfully');
                                }
                            });
                        }
                    });
                } catch (err) {
                    console.error(err.message);
                    res.status(500).send('Internal server error');
                    closeDB(db);
                };
                closeDB(db);
            });
        }
    });
});

app.post('/api/login', (req, res) => {
    const password = req.body["password"];
    let db = openDB();
    db.get('SELECT salt FROM users WHERE username = ?', [req.body.username], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
            closeDB(db);
        } else if (!row) {
            res.status(401).send('Unauthorized');
            closeDB(db);
        } else {
            salt = row.salt;
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal server error');
                    closeDB(db);
                    return;
                }
                db.get('SELECT * FROM users WHERE username = ?', [req.body.username], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        res.status(500).send('Internal server error');
                        closeDB(db);
                    } else if (!row) {
                        res.status(401).send('Unauthorized');
                        closeDB(db);
                    } else {
                        bcrypt.compare(password, row.pwdhash, (err, result) => {
                            if (err) {
                                console.error(err.message);
                                res.status(500).send('Internal server error');
                                closeDB(db);
                            } else if (result) {
                                const accessToken = generateRandomString(64);
                                db.run('UPDATE users SET accesstoken = ? WHERE username = ?', [accessToken, req.body.username], (err) => {
                                    if (err) {
                                        console.error(err.message);
                                        res.status(500).send('Internal server error');
                                        closeDB(db);
                                    } else {
                                        res.status(200).json({'accesstoken': accessToken, 'expiry': Date.now() + 86400000});
                                        closeDB(db);
                                    }
                                });
                            } else {
                                res.status(401).send('Unauthorized');
                                closeDB(db);
                            }
                        });
                    }
                });
            });
        }
    });
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