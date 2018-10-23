const Monetta = require('../lib');
const sinon = require('sinon');
const chai = require('chai');
const should = chai.should();

describe('config.generatePasswordHash()', () => {
  it('should call "process.emitWarning" if "config.silent" is false', async () => {
    const consoleLogBackup = console.log;
    console.log = () => {};
    const auth = new Monetta();
    await auth.db.connectionReady();
    console.log = consoleLogBackup;
    process.emitWarning = sinon.spy();
    auth.config.generatePasswordHash();
    process.emitWarning.called.should.be.true;
    auth.closeDbConnection();
  });
  it('should not call "process.emitWarning" if "config.silent" is true', async () => {
    const auth = new Monetta({ silent: true });
    await auth.db.connectionReady();
    process.emitWarning = sinon.spy();
    auth.config.generatePasswordHash();
    process.emitWarning.called.should.be.false;
    auth.closeDbConnection();
  });
});
