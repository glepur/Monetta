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
    console.log('Connected successfully to ' + uri);

    const db = client.db();

    exports.db = db;
    exports.users = db.collection(config.users.collection);
    exports.accessTokens = db.collection(config.accessTokens.collection);

    return db;
  });
};
