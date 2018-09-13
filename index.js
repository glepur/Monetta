'use strict';

const mongo = require('./mongo.js');
const nanoid = require('nanoid');

class Monetta {
  constructor(config) {
    this.config = config;
    init(config);
  }

  login() {
    return async (req, res, next) => {
      const user = await this.getUser(req.body);
      console.log(user);
      const token = this.generateAccessToken();
      await this.saveAccessToken(user, token);
      req.authToken = token;
      next();
    };
  }

  authorize() {
    return function() {};
  }

  logout() {
    return function() {};
  }

  getUser(body) {
    const usersMainField = this.config.users.mainField;
    const query = {
      [usersMainField]: body[usersMainField]
    };
    return mongo.users.findOne(query);
  }

  generateAccessToken() {
    return nanoid(48);
  }

  saveAccessToken(user, token) {
    return mongo.accessTokens.insertOne({
      userId: user._id,
      accessToken: token,
      createdAt: new Date()
    });
  }
}

async function init(config) {
  const db = await mongo.connect(config);
}

module.exports = Monetta;
