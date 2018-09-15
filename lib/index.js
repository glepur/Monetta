'use strict';

const Db = require('./db.js');
const nanoid = require('nanoid');

class Monetta {
  constructor(config) {
    this.config = config;
    this.db = new Db(config);
    this.db.connect();
  }

  login() {
    return async (req, res, next) => {
      const user = await this.getUser(req.body);
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
    return this.db.getUser(body, this.config);
  }

  generateAccessToken() {
    return nanoid(48);
  }

  saveAccessToken(user, token) {
    return this.db.saveAccessToken(user, token);
  }
}

module.exports = Monetta;
