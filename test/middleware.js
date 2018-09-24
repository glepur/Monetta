const Monetta = require('../lib');
const should = require('chai').should();
const httpMocks = require('node-mocks-http');
const MongoClient = require('mongodb').MongoClient;

const mongoConnectionUri =
  process.env.MONGO_CONNECTION_URI || 'mongodb://localhost/monetta-test';

const auth = new Monetta({
  mongoConnectionUri
});

let request;
let response;
const testToken = 'test-token';
const user = {
  username: 'test-user',
  password: 'test-password'
};

function connectToMongo() {
  return MongoClient.connect(
    mongoConnectionUri,
    { useNewUrlParser: true }
  );
}

before(async () => {
  try {
    const client = await connectToMongo();
    const db = client.db();
    const dbUser = await db.collection('users').insertOne(user);
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
  const loginMiddleware = auth.login();
  it('should create "authToken" property on "req" when correct credentials supplied', done => {
    request = httpMocks.createRequest({
      method: 'POST',
      url: '/login',
      body: user
    });
    response = httpMocks.createResponse();
    loginMiddleware(request, response, error => {
      if (error) {
        throw error;
      }
      request.should.have.property('authToken');
      done();
    });
  });
});

describe('authorize()', () => {
  const authMiddleware = auth.authorize();
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
