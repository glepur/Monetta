# Monetta

[![Build Status](https://travis-ci.org/glepur/Monetta.svg?branch=master)](https://travis-ci.org/glepur/Monetta)
[![Coverage Status](https://coveralls.io/repos/github/glepur/Monetta/badge.svg?branch=master)](https://coveralls.io/github/glepur/Monetta?branch=master)

### Token authorization for MongoDB and Express framework

Monetta is opinionated token authorization for MongoDB and Express (or any other Javascript framework using similar middleware functions). Principle is simple, Monetta receives configuration and returns middleware for login, authorization and logout.  
Configuration options include MongoDB connection parameters and names of collections where users and access tokens reside. After Monetta is initialized with proper config it creates MongoDB connection and uses it to read from users table and manage access tokens. Almost everything happens under the hood, everything user of the module has to do is call middleware to pass user credentials, receive token, check token etc.

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

## Configuration options

- `mongoConnection`: parameters used to specify connection to MongoDB, these options are transformed into MongoDB URI using [mongodb-uri-node](https://github.com/mongolab/mongodb-uri-node), `mongoConnectionUri` can be used instead of this option.
- `mongoConnectionUri`: raw string format used to initialize MongoDB connection, defaults to `mongodb://localhost/monetta`, `mongoConnection` option can be used instead.
- `users`: used to specify collection where users are being stored
  - `collection`: name of collection, defaults to `users`
  - `mainField`: field used to search through user collection, same field you submit with password when logging in (in most cases `username` or `email`), defaults to `username`
  - `passwordField`: field used to store passwords, defaults to `password`
- `accessTokens`: used to specify collection where access tokens are being stored, and options related to access tokens
  - `collection`: name of collection, defaults to `tokens`
  - `httpHeader`: header used to send access token when accessing routes that require authorization, defaults to `x-auth-token`
  - `length`: length of the access token, defaults to `48`
  - `maxAllowed`: same user can have multiple active access tokens, i.e. when logging in with multiple devices, this option specifies maximum number of access tokens active at once, defaults to `10`
- `generatePasswordHash`: function used to encrypt password, only input parameter is password as string, returns encrypted password as string, by default it only emmits warning and returns password in plain text, **WARNING!** storing passwords in plain text to database is dangerous, please, pretty please, supply your own hash function when using Monetta

## Middleware

### login

Returns middleware that checks request body for fields specified in `users` config, searches the database for matching user, and creates access token.  
For example, if user config looks like this:

```javascript
users: {
    collection: 'super_cool_users',
    mainField: 'super_cool_name',
    passwordField: 'super_cool_pass'
  }
```

Request body could look like this:

```json
{
  "super_cool_name": "test",
  "super_cool_pass": "test"
}
```

Login middleware will check `super_cool_users` collection for user with property `super_cool_name` that equals `test`. Then it will compare password hash from `super_cool_pass` property from request body to one in database. If user is not found or password hashes do not match it will throw error. If user is found it will create access token, store it in database, and create `req.accessToken` property containing said token.

```javascript
app.post('/login', auth.login(), (req, res) =>
  res.json({ token: req.authToken })
);
```

## TODO

- [ ] Add access token expiration
- [ ] Add option to use refresh token
