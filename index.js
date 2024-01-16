const express = require('express');
const app = express();
const port = 4444;

app.get('/api/register', (req, res) => {
    const { request } = req.query;
    
    if (request === '000C9B00') {
        res.send('uwu');
    } else {
        res.status(418).send('I\'m a teapot');
    }
});

app.get('/api/login', (req, res) => {
    const { param2 } = req.query;
    
    if (param2 === 'value2') {
        res.send('Endpoint 2 - Value 2');
    } else {
        res.send('Endpoint 2');
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
