const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function TuyaController(tuyaHandler) {
  /**
   * @api {post} /api/v1/service/tuya/connect Connect to Tuya cloud account.
   * @apiName save
   * @apiGroup Tuya
   */
  async function connect(req, res) {
    await tuyaHandler.connect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/tuya/status Get Tuya connection status.
   * @apiName status
   * @apiGroup Tuya
   */
  function status(req, res) {
    res.json({
      configured: tuyaHandler.configured,
      connected: tuyaHandler.connected,
    });
  }

  /**
   * @api {get} /api/v1/service/tuya/discover Retrieve Tuya devices from cloud.
   * @apiName discover
   * @apiGroup Tuya
   */
  async function discover(req, res) {
    const devices = await tuyaHandler.discover();
    res.json(devices);
  }

  return {
    'post /api/v1/service/tuya/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/tuya/status': {
      authenticated: true,
      controller: status,
    },
    'get /api/v1/service/tuya/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
