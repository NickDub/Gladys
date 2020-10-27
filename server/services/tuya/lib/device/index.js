const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { Error401, Error500 } = require('../../../../utils/httpErrors');
const { TUYA_EMAIL_KEY, TUYA_PASSWORD_KEY, TUYA_REGION_KEY } = require('../utils/constants');
const { connect } = require('./connect');
const { discover } = require('./discover');
const { poll } = require('./poll');
const { setValue } = require('./setValue');

/**
 * @description Add ability to control an Tuya device.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} tuyaCloud - Tuya Cloud Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const TuyaHandler = new TuyaHandler(gladys, client, serviceId);
 */
const TuyaHandler = function TuyaHandler(gladys, tuyaCloud, serviceId) {
  this.gladys = gladys;
  this.TuyaCloud = tuyaCloud;
  this.serviceId = serviceId;

  this.configured = false;
  this.connected = false;
};

/**
 * @description Throw error if Tuya Cloud call response has error.
 * @param {Object} response - Tuya Cloud call response.
 * @param {boolean} emit - True to emit message.
 * @param {boolean} config - True to reset config.
 * @example
 * const TuyaHandler = new TuyaHandler(gladys, client, serviceId);
 */
async function throwErrorIfNeeded(response, emit = false, config = false) {
  if (response.error) {
    if (response.error === 401) {
      this.connected = false;
      this.accessToken = '';
      this.apiKey = '';
      if (emit) {
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
          payload: response.msg,
        });
      }
      if (config) {
        await Promise.all([
          this.gladys.variable.setValue(TUYA_EMAIL_KEY, '', this.serviceId),
          this.gladys.variable.setValue(TUYA_PASSWORD_KEY, '', this.serviceId),
          this.gladys.variable.setValue(TUYA_REGION_KEY, '', this.serviceId),
        ]);
        this.configured = false;
      }
      throw new Error401(`EWeLink error: ${response.msg}`);
    }
    if (emit) {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.ERROR,
        payload: response.msg,
      });
    }
    throw new Error500(`EWeLink error: ${response.msg}`);
  }
}

TuyaHandler.prototype.connect = connect;
TuyaHandler.prototype.discover = discover;
TuyaHandler.prototype.poll = poll;
TuyaHandler.prototype.setValue = setValue;
TuyaHandler.prototype.throwErrorIfNeeded = throwErrorIfNeeded;

module.exports = TuyaHandler;
