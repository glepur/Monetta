# Monetta

[![Build Status](https://travis-ci.org/glepur/Monetta.svg?branch=master)](https://travis-ci.org/glepur/Monetta)
[![Coverage Status](https://coveralls.io/repos/github/glepur/Monetta/badge.svg?branch=master)](https://coveralls.io/github/glepur/Monetta?branch=master)

### Token authorization for MongoDB and Express framework

Monetta is opinionated token authorization for MongoDB and Express (or any other middleware based Javascript framework). Principle is simple, you pass in configuration and get middleware for login, authorization and logout.

## Installation

`npm i -S monetta`

## Example

```javascript
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const crypto = require('crypto');
const Monetta = require('monetta');

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
  // mongoConnectionUri: 'mongodb://localhost/monetta',
  users: {
    collection: 'users',
    mainField: 'username',
    passwordField: 'password'
  },
  accessTokens: {
    collection: 'tokens',
    httpHeader: 'x-auth-token',
    length: 24,
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
app.post('/logout-all', auth.logoutAll(), (req, res) =>
  res.json({
    message: 'All devices are logged out'
  })
);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(403).json({ error: err.message });
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
```

## TODO
- [ ] Add access token expiration
- [ ] Add option to use refresh token
