const mongo = require('./mongo.js');

class Db {
  constructor(config) {
    this.config = config;
  }

  connect() {
    mongo.connect(this.config);
  }

  disconnect() {
    mongo.disconnect();
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
