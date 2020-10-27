const Promise = require('bluebird');
const { find, filter, get, isUndefined } = require('lodash');
const TuyaDiscover = require('./tuya-discover.json');

class TuyaCloud {
  constructor({ userName, password, region = 'eu', bizType = 'tuya', countryCode = '33' }) {
    if (isUndefined(userName) || isUndefined(password)) {
      throw new Error('Missing loging email/pass');
    }

    this.loginData = {
      userName,
      password,
      countryCode,
      bizType
    };
    this.session = {
      accessToken: '',
      refreshToken: '',
      expireIn: 0,
    };

    this.devicesCache = [];
  }

  login() {
    if (this.loginData.username === '' || this.loginData.password === '') {
      throw new Error('Missing loging email/pass');
    }
    if (this.loginData.userName === 'email@valid.ok' && this.loginData.password === 'S0m3Th1ngTru3') {
      this.session.accessToken = 'EUheu1234567890123eZh0itKcgUTONkd';
      this.session.refreshToken = 'EUheu1234567890123eZh0i7lD4FKBat6';
      this.session.expiresIn = 864000;
    }
    throw new Error('Get accesstoken failed. Username or password error!');
  }

  async discoverDevices() {
    if (this.session.accessToken) {
      throw new Error('Error');
    }
    this.devicesCache = get(TuyaDiscover, 'data.payload.devices');
    return Promise.resolve(this.devicesCache);
  }

  getDevices() {
    return this.devicesCache;
  }

  getDeviceById(devId) {
    return find(this.devicesCache, (device) => {
      return device.id() === devId;
    });
  }

  getDevicesByType(devType) {
    return filter(this.devicesCache, { dev_type: devType });
  }
}

module.exports = TuyaCloud;
