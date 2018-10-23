const Mongo = require('../lib/mongo.js');
const chai = require('chai');
const should = chai.should();

describe('mongo.disconnect()', () => {
  it('should throw error if connection not established', () => {
    const mongo = new Mongo({});
    mongo.disconnect.bind(mongo).should.throw(Error);
  });
});
