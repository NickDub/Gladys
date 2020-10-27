const logger = require('../../utils/logger');
const TuyaHandler = require('./lib/device');
const TuyaController = require('./api/tuya.controller');

module.exports = function TuyaService(gladys, serviceId) {
  // require the Tuya module
  // @ts-ignore
  const tuyaCloud = require('tuya-cloud');
  const tuyaHandler = new TuyaHandler(gladys, tuyaCloud, serviceId);

  /**
   * @public
   * @description This function starts the Tuya service
   * @example
   * gladys.services.tuya.start();
   */
  async function start() {
    logger.log('starting Tuya service');
    await tuyaHandler.connect();
  }

  /**
   * @public
   * @description This function stops the Tuya service
   * @example
   * gladys.services.tuya.stop();
   */
  async function stop() {
    logger.log('stopping Tuya service');
  }

  return Object.freeze({
    start,
    stop,
    device: tuyaHandler,
    controllers: TuyaController(tuyaHandler),
  });
};
