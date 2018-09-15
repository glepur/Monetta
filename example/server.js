'use strict';

const express = require('express');
var bodyParser = require('body-parser');
const app = express();
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
    collection: 'tokens'
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
  res.json({
    message: 'This route requires authorization',
    profile: { user: req.user }
  })
);
app.post('/logout', auth.logout(), (req, res) =>
  res.json({
    message: 'Logout succesful'
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  res.json({ error });
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
