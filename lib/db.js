const mongo = require('./mongo.js');

class Db {
  constructor(config) {
    this.config = config;
    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
    });
  }

  connect() {
    mongo
      .connect(this.config)
      .then(this.resolveConnection, this.rejectConnection);
  }

  disconnect() {
    mongo.disconnect();
  }

  connectionReady() {
    return this.connectionPromise;
  }

  getUser(query) {
    return mongo.users.findOne(query);
  }

  saveAccessToken(user, token) {
    return mongo.accessTokens.insertOne({
      userId: user._id,
      accessToken: token,
      createdAt: new Date()
    });
  }

  getAccessToken(query) {
    return mongo.accessTokens.findOne(query);
  }

  countTokens(query) {
    return mongo.accessTokens.countDocuments(query);
  }

  removeTokens(query) {
    return mongo.accessTokens.deleteMany(query);
  }
}

module.exports = Db;
