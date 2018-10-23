'use strict';

const Db = require('./db.js');
const nanoid = require('nanoid');
const deepExtend = require('deep-extend');

const defaultConfig = {
  mongoConnection: {
    hosts: [
      {
        host: 'localhost',
        port: 27017
      }
    ],
    database: 'monetta'
  },
  users: {
    collection: 'users',
    mainField: 'username',
    passwordField: 'password'
  },
  accessTokens: {
    collection: 'tokens',
    httpHeader: 'x-auth-token',
    length: 48,
    maxAllowed: 10
  },
  silent: false
};

const generatePasswordHash = config => password => {
  !config.silent &&
    process.emitWarning(
      '(Monetta) "generatePasswordHash" function is not specified, raw passwords will be stored in database, this is not recommended.'
    );
  return password;
};

class Monetta {
  constructor(config) {
    this.config = deepExtend({}, defaultConfig, config);
    this.config.generatePasswordHash =
      this.config.generatePasswordHash || generatePasswordHash(this.config);
    this.db = new Db(this.config);
    this.db.connect();
  }

  login() {
    return async (req, res, next) => {
      try {
        const query = this._getUserMainFieldQuery(req.body);
        const user = await this.getUser(query);
        if (!user) {
          next(new Error('User not found'));
          return;
        }
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
        const tokenEntity = await this.getTokenEntity(
          req.headers[this.config.accessTokens.httpHeader]
        );
        const user = await this.getUser({ _id: tokenEntity.userId });
        if (!user) {
          next(new Error('User not found'));
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
    return async (req, res, next) => {
      try {
        const tokenEntity = await this.getTokenEntity(
          req.headers[this.config.accessTokens.httpHeader]
        );
        await this.removeTokenEntities({ _id: tokenEntity._id });
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  logoutAll() {
    return async (req, res, next) => {
      try {
        const tokenEntity = await this.getTokenEntity(
          req.headers[this.config.accessTokens.httpHeader]
        );
        const user = await this.getUser({ _id: tokenEntity.userId });
        await this.removeTokenEntities({ userId: tokenEntity.userId });
        next();
      } catch (err) {
        next(err);
      }
    };
  }

  closeDbConnection() {
    this.db.disconnect();
  }

  async getTokenEntity(accessToken) {
    if (!accessToken) {
      throw new Error('Please provide access token');
    }
    const tokenEntity = await this.getAccessToken({ accessToken });
    if (!tokenEntity) {
      throw new Error('Token is not valid');
    }
    return tokenEntity;
  }

  removeTokenEntities(query) {
    return this.db.removeTokens(query);
  }

  generateAccessToken() {
    return nanoid(this.config.accessTokens.length);
  }

  saveAccessToken(user, token) {
    return this.db.saveAccessToken(user, token);
  }

  getAccessToken(query) {
    return this.db.getAccessToken(query);
  }

  getUser(query) {
    return this.db.getUser(query);
  }

  async _checkTokenNumberExceeded(user) {
    const activeAccessTokens = await this.db.countTokens({ userId: user._id });
    const maxTokensAllowed = this.config.accessTokens.maxAllowed;
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
}

module.exports = Monetta;
