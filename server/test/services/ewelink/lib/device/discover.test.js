const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const {
  event,
  serviceId,
  stateManagerWith0Devices,
  stateManagerWith3Devices,
  variableNotConfigured,
  variableOk,
} = require('../../mocks/consts.test');
const Gladys2Ch1Device = require('../../mocks/Gladys-2ch1.json');
const Gladys2Ch2Device = require('../../mocks/Gladys-2ch2.json');
const GladysOfflineDevice = require('../../mocks/Gladys-offline.json');
const GladysPowDevice = require('../../mocks/Gladys-pow.json');
const GladysThDevice = require('../../mocks/Gladys-th.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const EweLinkApiMock = require('../../mocks/ewelink-api.mock.test');
const EweLinkApiEmptyMock = require('../../mocks/ewelink-api-empty.mock.test');

const { assert } = sinon;

const EwelinkService = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApiMock,
});
const EwelinkServiceEmpty = proxyquire('../../../../../services/ewelink/index', {
  'ewelink-api': EweLinkApiEmptyMock,
});

const gladysWith0Devices = {
  variable: variableOk,
  event,
  stateManager: stateManagerWith0Devices,
};
const gladysWith3Devices = {
  variable: variableOk,
  event,
  stateManager: stateManagerWith3Devices,
};

describe('EweLinkHandler discover', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should found 6 devices, 6 of wich are new unknown devices', async () => {
    const eweLinkService = EwelinkService(gladysWith0Devices, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices.length).to.equal(6);
    expect(newDevices).to.have.deep.members([
      Gladys2Ch1Device,
      Gladys2Ch2Device,
      GladysOfflineDevice,
      GladysPowDevice,
      GladysThDevice,
      GladysUnhandledDevice,
    ]);
  });
  it('should found 6 devices, 3 of wich are already in Gladys and 3 are a new unknown device', async () => {
    const eweLinkService = EwelinkService(gladysWith3Devices, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices.length).to.equal(3);
    expect(newDevices).to.have.deep.members([GladysOfflineDevice, GladysThDevice, GladysUnhandledDevice]);
  });
  it('should found 0 devices', async () => {
    const eweLinkService = EwelinkServiceEmpty(gladysWith0Devices, serviceId);
    const newDevices = await eweLinkService.device.discover();
    expect(newDevices).to.have.deep.members([]);
  });
  it('should return not configured error', async () => {
    const gladys = { event, variable: variableNotConfigured };
    const eweLinkService = EwelinkService(gladys, serviceId);
    eweLinkService.device.connected = false;
    try {
      await eweLinkService.device.discover();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: 'Service is not configured',
      });
      expect(error.message).to.equal('eWeLink: Error, service is not configured');
    }
  });
  it('should throw an error and emit a message when AccessToken is no more valid', async () => {
    const gladys = { event, variable: variableOk };
    const eweLinkService = EwelinkService(gladys, serviceId);
    eweLinkService.device.connected = true;
    eweLinkService.device.accessToken = 'NoMoreValidAccessToken';
    try {
      await eweLinkService.device.discover();
      assert.fail();
    } catch (error) {
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: 'Authentication error',
      });
      expect(error.status).to.equal(403);
      expect(error.message).to.equal('eWeLink: Authentication error');
    }
  });
});
