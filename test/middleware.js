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
      method: 'POST',
      url: '/login',
      body: testUser
    });
    request.should.have
      .property('authToken')
      .with.lengthOf(auth.config.accessTokens.length);
  });
});

describe('authorize()', () => {
  it('should create "user" property on "req" when valid token supplied', async () => {
    const request = await callMiddleware(auth.authorize(), {
      method: 'GET',
      url: '/profile',
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
    const { authToken } = await callMiddleware(auth.login(), {
      method: 'POST',
      url: '/login',
      body: testUser
    });
    should.exist(authToken);
    authToken.should.have.lengthOf(auth.config.accessTokens.length);

    await callMiddleware(auth.logout(), {
      method: 'POST',
      url: '/logout',
      headers: {
        'x-auth-token': authToken
      }
    }).should.be.fulfilled;

    return callMiddleware(auth.authorize(), {
      method: 'GET',
      url: '/profile',
      headers: {
        'x-auth-token': authToken
      }
    }).catch(err => {
      should.exist(err);
      err.should.have.property('message');
    });
  });
});

after(async () => {
  try {
    const client = await connectToMongo();
    const db = client.db();
    await db.dropDatabase();
    client.close();
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
