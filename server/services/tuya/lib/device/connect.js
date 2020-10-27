const Promise = require('bluebird');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { TUYA_EMAIL_KEY, TUYA_PASSWORD_KEY, TUYA_REGION_KEY, TUYA_REGIONS } = require('../utils/constants');

/**
 * @description Connect to eWeLink cloud account and get access token and api key.
 * @example
 * connect();
 */
async function connect() {
  this.configured = false;
  this.connected = false;

  /* eslint-disable prefer-const */
  let [email, password, region] = await Promise.all([
    this.gladys.variable.getValue(TUYA_EMAIL_KEY, this.serviceId),
    this.gladys.variable.getValue(TUYA_PASSWORD_KEY, this.serviceId),
    this.gladys.variable.getValue(TUYA_REGION_KEY, this.serviceId),
  ]);
  /* eslint-enable prefer-const */

  if (!email || !password) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.ERROR,
      payload: 'Service is not configured',
    });
    throw new ServiceNotConfiguredError('Tuya: Error, service is not configured');
  }

  if (!Object.values(TUYA_REGIONS).includes(region)) {
    const connection = new this.TuyaCloud({ email, password });



    
    const response = await connection.getRegion();
    // belt, suspenders ;)
    if (response.error && [401, 406].indexOf(response.error) !== -1) {
      response.msg = 'Service is not configured';
    }
    await this.throwErrorIfNeeded(response, true, true);

    ({ region } = response);
    await this.gladys.variable.setValue(TUYA_REGION_KEY, region, this.serviceId);
  }

  this.configured = true;

  const connection = new this.TuyaCloud({ email, password, region });
  const auth = await connection.getCredentials();
  await this.throwErrorIfNeeded(auth, true, true);

  this.connected = true;
  this.accessToken = auth.at;
  this.apiKey = auth.user.apikey;

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TUYA.CONNECTED,
  });
}

module.exports = {
  connect,
};
