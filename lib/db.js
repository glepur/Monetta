const Mongo = require('./mongo.js');

class Db {
  constructor(config) {
    this.config = config;
    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });
    this.mongo = new Mongo(config);
  }

  connect() {
    this.mongo
      .connect(this.config)
      .then(this.resolveConnection, this.rejectConnection);
  }

  disconnect() {
    this.mongo.disconnect();
  }

  connectionReady() {
    return this.connectionPromise;
  }

  getUser(query) {
    return this.mongo.users.findOne(query);
  }

  saveAccessToken(user, token) {
    return this.mongo.accessTokens.insertOne({
      userId: user._id,
      accessToken: token,
      createdAt: new Date()
    });
  }

  getAccessToken(query) {
    return this.mongo.accessTokens.findOne(query);
  }

  countTokens(query) {
    return this.mongo.accessTokens.countDocuments(query);
  }

  removeTokens(query) {
    return this.mongo.accessTokens.deleteMany(query);
  }
}

module.exports = Db;
