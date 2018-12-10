'use strict';

const mongodbURI = require('mongodb-uri');
const MongoClient = require('mongodb').MongoClient;
const createError = require('http-errors');

class Mongo {
  constructor(config) {
    this.config = config;
    this.uri =
      config.mongoConnectionUri || mongodbURI.format(config.mongoConnection);
  }

  connect() {
    return MongoClient.connect(
      this.uri,
      { useNewUrlParser: true }
    ).then(client => {
      !this.config.silent &&
        console.log('Connected successfully to ' + this.uri);

      const db = client.db();

      this.client = client;
      this.db = db;
      this.users = db.collection(this.config.users.collection);
      this.accessTokens = db.collection(this.config.accessTokens.collection);

      return db;
    });
  }

  disconnect() {
    if (!this.client || !this.client.isConnected()) {
      throw new createError.InternalServerError(
        '(Monetta) Cannot disconnect from MongoDB, connection not established.'
      );
    }
    this.client.close();
  }
}

module.exports = Mongo;
