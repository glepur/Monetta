const Monetta = require('../lib');
const should = require('chai').should();
const httpMocks = require('node-mocks-http');
const MongoClient = require('mongodb').MongoClient;

const mongoConnectionUri =
  process.env.MONGO_CONNECTION_URI || 'mongodb://localhost/monetta-test';

const auth = new Monetta({
  mongoConnectionUri
});

const testToken = 'test-token';
const testUser = {
  username: 'test-user',
  password: 'test-password'
};

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
    const request = await loginUserPromisified(testUser);
    request.should.have.property('authToken');
  });
});

describe('authorize()', () => {
  const authMiddleware = auth.authorize();
  it('should create "user" property on "req" when valid token supplied', done => {
    const request = httpMocks.createRequest({
      method: 'GET',
      url: '/profile',
      headers: {
        'x-auth-token': testToken
      }
    });
    const response = httpMocks.createResponse();
    authMiddleware(request, response, error => {
      if (error) {
        throw error;
      }
      request.should.have.property('user');
      done();
    });
  });
});

describe('logout()', () => {
  const logoutMiddleware = auth.logout();
  it('should create "user" property on "req" when valid token supplied', done => {
    request = httpMocks.createRequest({
      method: 'GET',
      url: '/profile',
      headers: {
        'x-auth-token': testToken
      }
    });
    response = httpMocks.createResponse();
    authMiddleware(request, response, error => {
      if (error) {
        throw error;
      }
      request.should.have.property('user');
      done();
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

function loginUserPromisified(user) {
  return new Promise((resolve, reject) => {
    const loginMiddleware = auth.login();
    const request = httpMocks.createRequest({
      method: 'POST',
      url: '/login',
      body: user
    });
    const response = httpMocks.createResponse();
    loginMiddleware(request, response, error => {
      if (error) {
        throw error;
      }
      console.log(request);
      resolve(request);
    });
  });
}
