const Monetta = require('../lib');
const chai = require('chai');
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
const httpMocks = require('node-mocks-http');
const MongoClient = require('mongodb').MongoClient;

chai.use(chaiAsPromised);

const mongoConnectionUri =
  process.env.MONGO_CONNECTION_URI || 'mongodb://localhost/monetta-test';

const testToken = 'test-token';
const testUser = {
  username: 'test-user',
  password: 'test-password'
};
const accessTokenLength = 24;

const auth = new Monetta({
  mongoConnectionUri,
  generatePasswordHash: p => p
});

before(async () => {
  try {
    await auth.db.connectionReady();
    const client = await connectToMongo();
    const db = client.db();
    const dbUser = await db.collection('users').insertOne(testUser);
    await db.collection('tokens').insertOne({
      userId: dbUser.insertedId,
      accessToken: testToken
    });
    client.close();
  } catch (err) {
    throw err;
  }
});

describe('login()', () => {
  it('should create "authToken" property on "req" when correct credentials supplied', async () => {
    const request = await callMiddleware(auth.login(), {
      body: testUser
    });
    request.should.have
      .property('authToken')
      .with.lengthOf(auth.config.accessTokens.length);
  });
  it('should throw error when request body empty', async () => {
    await callMiddleware(auth.login()).should.be.rejectedWith(Error);
  });
  it('should throw error when main field empty', async () => {
    var userClone = Object.assign({}, testUser);
    delete userClone.username;
    await callMiddleware(auth.login(), {
      body: userClone
    }).should.be.rejectedWith(Error);
  });
  it('should throw error when password empty', async () => {
    var userClone = Object.assign({}, testUser);
    delete userClone.password;
    await callMiddleware(auth.login(), {
      body: userClone
    }).should.be.rejectedWith(Error);
  });
  it('should throw error when main field wrong', async () => {
    var userClone = Object.assign({}, testUser);
    userClone.username = 'wrongUsername';
    await callMiddleware(auth.login(), {
      body: userClone
    }).should.be.rejectedWith(Error);
  });
  it('should throw error when password wrong', async () => {
    var userClone = Object.assign({}, testUser);
    userClone.password = 'wrongPassword';
    await callMiddleware(auth.login(), {
      body: userClone
    }).should.be.rejectedWith(Error);
  });
});

describe('authorize()', () => {
  it('should create "user" property on "req" when valid token supplied', async () => {
    const request = await callMiddleware(auth.authorize(), {
      headers: {
        'x-auth-token': testToken
      }
    });
    request.should.have.property('user');
    request.user.should.have.property('_id');
    request.user.should.have.property('username');
    request.user.should.have.property('password');
  });
});

describe('logout()', () => {
  it('should invalidate "authToken"', async () => {
    const authToken = await getTokenForUser(testUser);

    await callMiddleware(auth.logout(), {
      headers: {
        'x-auth-token': authToken
      }
    }).should.be.fulfilled;

    await authorizeWithToken(authToken).should.be.rejectedWith(Error);
  });
});

describe('logoutAll()', () => {
  it('should invalidate all auth tokens for specific user', async () => {
    const authToken1 = await getTokenForUser(testUser);
    const authToken2 = await getTokenForUser(testUser);

    await callMiddleware(auth.logoutAll(), {
      headers: {
        'x-auth-token': authToken1
      }
    }).should.be.fulfilled;

    await authorizeWithToken(authToken1).should.be.rejectedWith(Error);
    await authorizeWithToken(authToken2).should.be.rejectedWith(Error);
  });
});

after(async () => {
  try {
    const client = await connectToMongo();
    const db = client.db();
    await db.dropDatabase();
    client.close();
    auth.closeDbConnection();
  } catch (err) {
    throw err;
  }
});

function connectToMongo() {
  return MongoClient.connect(
    mongoConnectionUri,
    { useNewUrlParser: true }
  );
}

function callMiddleware(middleware, requestConfig) {
  return new Promise((resolve, reject) => {
    const request = httpMocks.createRequest(requestConfig);
    const response = httpMocks.createResponse();
    middleware(request, response, error => {
      if (error) {
        reject(error);
      }
      resolve(request);
    });
  });
}

function getTokenForUser(user) {
  return callMiddleware(auth.login(), {
    method: 'POST',
    url: '/login',
    body: user
  }).then(request => {
    request.should.have
      .property('authToken')
      .with.lengthOf(auth.config.accessTokens.length);
    return request.authToken;
  });
}

function authorizeWithToken(token) {
  return callMiddleware(auth.authorize(), {
    headers: {
      'x-auth-token': token
    }
  });
}
