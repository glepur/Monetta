const mongo = require('./mongo.js');

class Db {
  constructor(config) {
    this.config = config;
  }

  connect() {
    mongo.connect(this.config);
  }

  getUser(body, config) {
    const usersMainField = config.users.mainField;
    const query = {
      [usersMainField]: body[usersMainField]
    };
    return mongo.users.findOne(query);
  }

  saveAccessToken(user, token) {
    return mongo.accessTokens.insertOne({
      userId: user._id,
      accessToken: token,
      createdAt: new Date()
    });
  }
}

module.exports = Db;
