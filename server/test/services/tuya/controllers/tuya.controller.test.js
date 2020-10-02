const sinon = require('sinon');
const TuyaController = require('../../../../services/tuya/api/tuya.controller');

const { assert, fake } = sinon;

const status = {};
const devices = [];
const tuyaHandler = {
    connect: fake.returns(true),
    status: fake.resolves(status),
    discover: fake.returns(devices),
  };

describe('TuyaController POST /service/tuya/connect', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaHandler);
    sinon.reset();
  });

  it('should connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/tuya/connect'].controller(req, res);
    assert.calledOnce(tuyaHandler.connect);
    assert.calledOnce(res.json);
  });
});

describe('TuyaController GET /api/v1/service/tuya/status', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaHandler);
    sinon.reset();
  });

  it('should return status', async () => {
    status.configured = true;
    status.connected = true;

    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/tuya/status'].controller(req, res);
    assert.calledOnce(tuyaHandler.status);
    assert.calledOnce(res.json);
  });
});

describe('TuyaController GET /api/v1/service/tuya/discover', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaHandler);
    sinon.reset();
  });

  it('should get devices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/tuya/discover'].controller(req, res);
    assert.calledOnce(tuyaHandler.discover);
    assert.calledOnce(res.json);
  });
});
