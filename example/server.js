'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const crypto = require('crypto');
const Monetta = require('../lib/index.js');

const config = {
  mongoConnection: {
    username: null,
    password: null,
    hosts: [
      {
        host: 'localhost',
        port: 27017
      }
    ],
    database: 'monetta'
  },
  // mongoConnectionURI: 'mongodb://localhost/monetta'
  users: {
    collection: 'users',
    mainField: 'username',
    passwordField: 'password'
  },
  accessTokens: {
    collection: 'tokens',
    maxAllowed: 5
  },
  generatePasswordHash: password => {
    const hash = crypto.createHmac('sha256', 'Secret squirrel');
    hash.update(password);
    return hash.digest('hex');
  }
};

const auth = new Monetta(config);

app.use(bodyParser.json());

app.get('/', (req, res) =>
  res.json({ message: 'This route does not require authorization.' })
);
app.post('/login', auth.login(), (req, res) =>
  res.json({ token: req.authToken })
);
app.get('/profile', auth.authorize(), (req, res) =>
  res.json({ user: req.user })
);
app.post('/logout', auth.logout(), (req, res) =>
  res.json({
    message: 'Logout succesful'
  })
);

app.use((err, req, res, next) => {
  console.log(err);
  res.json({ error: err.message });
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
