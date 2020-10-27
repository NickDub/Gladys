const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { serviceId, event, variableOk, deviceManagerFull, stateManagerFull } = require('../../mocks/consts.test');
const tuyaCloud = require('../../mocks/tuya-cloud.mock.test');

const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');

const { assert } = sinon;

const TuyaService = proxyquire('../../../../../services/tuya/index', {
  'tuya-cloud': tuyaCloud,
});

const gladys = {
  variable: variableOk,
  event,
  device: deviceManagerFull,
  stateManager: stateManagerFull,
};

describe('TuyaHandler poll', () => {
  const tuyaService = TuyaService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaService.device.connected = false;
  });

  it('should poll device and emit 1 state', async () => {
    await tuyaService.device.poll(Gladys2Ch1Device);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'tuya.connected' });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'tuya:10004533ae:1:binary',
      state: 1,
    });
  });
  it('should poll device and emit 2 states', async () => {
    await tuyaService.device.poll(GladysPowDevice);
    assert.callCount(gladys.event.emit, 3);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'tuya.connected' });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'tuya:10004531ae:0:binary',
      state: 1,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'tuya:10004531ae:0:power',
      state: 22.3,
    });
  });
  it('should poll device and emit 3 states and 1 param', async () => {
    await tuyaService.device.poll(GladysThDevice);
    assert.callCount(gladys.event.emit, 5);
    assert.calledWithExactly(gladys.event.emit, 'websocket.send-all', { type: 'tuya.connected' });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'tuya:10004535ae:0:binary',
      state: 1,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'tuya:10004535ae:0:temperature-sensor',
      state: 20,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.new-state', {
      device_feature_external_id: 'tuya:10004535ae:0:humidity-sensor',
      state: 42,
    });
    assert.calledWithExactly(gladys.event.emit, 'device.add-param', { name: 'FIRMWARE', value: '3.3.0' });
  });
  it('should throw an error when device is offline', async () => {
    try {
      await tuyaService.device.poll(GladysOfflineDevice);
      assert.fail();
    } catch (error) {
      expect(error.message).to.equal('Tuya error: Device is not currently online');
    }
  });
});
