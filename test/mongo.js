const Mongo = require('../lib/mongo.js');
const chai = require('chai');
const expect = chai.expect;

describe('mongo.disconnect()', () => {
  it('should throw error if connection not established', () => {
    const mongo = new Mongo({});
    expect(mongo.disconnect.bind(mongo)).to.throw(Error);
  });
});
