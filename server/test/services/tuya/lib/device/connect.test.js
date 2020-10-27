const { expect } = require('chai');
const { assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const {
  serviceId,
  event,
  variableNotConfigured,
  variableOk,
  variableOkNoRegion,
  variableOkFalseRegion,
  variableNok,
} = require('../../mocks/consts.test');
const tuyaCloud = require('../../mocks/tuya-cloud.mock.test');

const TuyaService = proxyquire('../../../../../services/tuya/index', {
  'tuya-cloud': tuyaCloud,
});

describe('TuyaHandler connect', () => {
  it('should connect', async () => {
    const gladys = { event, variable: variableOk };
    const tuyaService = TuyaService(gladys, serviceId);
    await tuyaService.device.connect();

    assert.notCalled(gladys.variable.setValue);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'tuya.connected' });

    expect(tuyaService.device.configured).to.equal(true);
    expect(tuyaService.device.connected).to.equal(true);
  });
  it('should return not configured error', async () => {
    const gladys = { event, variable: variableNotConfigured };
    const tuyaService = TuyaService(gladys, serviceId);
    try {
      await tuyaService.device.connect();
      assert.fail();
    } catch (error) {
      assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', {
        type: 'tuya.error',
        payload: 'Service is not configured',
      });
      expect(error.message).to.equal('Tuya: Error, Service is not configured');
    }
  });
  it('should get region and connect', async () => {
    const gladys = { event, variable: variableOkNoRegion };
    const tuyaService = TuyaService(gladys, serviceId);
    await tuyaService.device.connect();

    assert.calledWithExactly(gladys.variable.setValue, 'EWELINK_REGION', 'eu', serviceId);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'tuya.connected' });

    expect(tuyaService.device.configured).to.equal(true);
    expect(tuyaService.device.connected).to.equal(true);
  });
  it('should get right region and connect', async () => {
    const gladys = { event, variable: variableOkFalseRegion };
    const tuyaService = TuyaService(gladys, serviceId);
    await tuyaService.device.connect();

    assert.calledWithExactly(gladys.variable.setValue, 'EWELINK_REGION', 'eu', serviceId);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'tuya.connected' });

    expect(tuyaService.device.configured).to.equal(true);
    expect(tuyaService.device.connected).to.equal(true);
  });
  it('should throw an error and emit a message when authentication fail', async () => {
    const gladys = { event, variable: variableNok };
    const tuyaService = TuyaService(gladys, serviceId);
    try {
      await tuyaService.device.connect();
      assert.fail();
    } catch (error) {
      assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', {
        type: 'tuya.error',
        payload: 'Authentication error',
      });
      expect(error.status).to.equal(401);
      expect(error.message).to.equal('Tuya: Error, Authentication error');
    }
  });
});
