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
      const query = getUserMainFieldQuery(req.body, this.config);
      const user = await this.getUser(query);
      const token = this.generateAccessToken();
      await this.saveAccessToken(user, token);
      req.authToken = token;
      next();
    };
  }

  authorize() {
    return async (req, res, next) => {
      const accessToken = req.headers['x-auth-token'];
      if (!accessToken) {
        next('Please provide access token');
      }
      const tokenEntity = await this.getAccessToken({ accessToken });
      if (!tokenEntity) {
        next('Token is not valid');
      }
      const user = await this.getUser({ _id: tokenEntity.userId });
      if (!user) {
        next('User not found');
      }
      req.user = user;
      next();
    };
  }

  logout() {
    return function() {};
  }

  getUser(query) {
    return this.db.getUser(query);
  }

  generateAccessToken() {
    return nanoid(48);
  }

  saveAccessToken(user, token) {
    return this.db.saveAccessToken(user, token);
  }

  getAccessToken(query) {
    return this.db.getAccessToken(query);
  }
}

function getUserMainFieldQuery(body, config) {
  const usersMainField = config.users.mainField;
  const query = {
    [usersMainField]: body[usersMainField]
  };
}

module.exports = Monetta;
