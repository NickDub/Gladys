const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { event, variableOk } = require('./mocks/consts.test');
const TuyaApi = require('./mocks/tuya-api.mock.test');

const TuyaService = proxyquire('../../../services/tuya/index', {
  'tuya-api': TuyaApi,
});

const gladys = {
  event,
  variable: variableOk,
};

describe('TuyaService', () => {
  const tuyaService = TuyaService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  it('should have controllers', () => {
    expect(tuyaService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await tuyaService.start();
  });
  it('should stop service', async () => {
    await tuyaService.stop();
  });
});
