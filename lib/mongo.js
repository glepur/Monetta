'use strict';

const MongoClient = require('mongodb').MongoClient;
const mongodbURI = require('mongodb-uri');

exports.connect = function connect(config) {
  const uri =
    config.mongoConnectionUri || mongodbURI.format(config.mongoConnection);

  return MongoClient.connect(
    uri,
    { useNewUrlParser: true }
  ).then(function(client) {
    config.logLevel > 1 && console.log('Connected successfully to ' + uri);

    const db = client.db();

    exports.client = client;
    exports.db = db;
    exports.users = db.collection(config.users.collection);
    exports.accessTokens = db.collection(config.accessTokens.collection);

    return db;
  });
};

exports.disconnect = function disconnect() {
  if (!exports.client || !exports.client.isConnected()) {
    throw new Error(
      '(Monetta) Cannot disconnect from MongoDB, connection not established.'
    );
  }
  exports.client.close();
};
