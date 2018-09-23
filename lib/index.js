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
      try {
        const query = this._getUserMainFieldQuery(req.body);
        const user = await this.getUser(query);
        await this._checkTokenNumberExceeded(user);
        this._checkPasswordHashes(req.body, user);
        const token = this.generateAccessToken();
        await this.saveAccessToken(user, token);
        req.authToken = token;
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  authorize() {
    return async (req, res, next) => {
      try {
        const tokenEntity = await this._getTokenEntity(
          req.headers['x-auth-token']
        );
        const user = await this.getUser({ _id: tokenEntity.userId });
        if (!user) {
          next('User not found');
          return;
        }
        req.user = user;
        next();
      } catch (err) {
        next(err);
      }
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

  async _checkTokenNumberExceeded(user) {
    const activeAccessTokens = await this.db.countTokens({ userId: user._id });
    const maxTokensAllowed = this.config.accessTokens.maxAllowed || 10;
    if (activeAccessTokens > maxTokensAllowed) {
      throw new Error('Too many active access tokens.');
    }
  }

  _getUserMainFieldQuery(body) {
    const usersMainField = this.config.users.mainField;
    const mainFieldValue = body[usersMainField];
    if (!mainFieldValue) {
      throw new Error(`Please provide ${usersMainField}`);
    }
    return {
      [usersMainField]: mainFieldValue
    };
  }

  _checkPasswordHashes(body, user) {
    const passwordField = this.config.users.passwordField;
    const passwordHash = this.config.generatePasswordHash(body[passwordField]);
    if (passwordHash !== user[passwordField]) {
      throw new Error('Wrong credentials');
    }
    return true;
  }

  async _getTokenEntity(accessToken) {
    if (!accessToken) {
      throw new Error('Please provide access token');
      return;
    }
    const tokenEntity = await this.getAccessToken({ accessToken });
    if (!tokenEntity) {
      throw new Error('Token is not valid');
    }
    return tokenEntity;
  }
}

module.exports = Monetta;
