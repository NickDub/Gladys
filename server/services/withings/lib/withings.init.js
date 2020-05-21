// @ts-nocheck
const uuid = require('uuid');
const OAuth2Manager = require('../../../lib/oauth2');
const logger = require('../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_TYPES,
} = require('../../../utils/constants');

/**
 * @description Build a new gladys device from withings device.
 *
 * @param {Object} withingsDevice - Withings device to transform.
 * @param {string} serviceId - Withings service id.
 * @param {string} accessToken - Access token of oauth2.
 * @param {string} refreshToken - Refresh token of oauth2.
 * @param {string} tokenType - Token type of oauth2.
 * @returns {Object} Return a gladys device.
 * @example
 * withings.buildNewDevice({...}, '7fdsf4s68r4gfr68f4r63csd7f6f4c3r85', '78v4f3df83g74v1fsd8375f63gvrf5c',
 * '4635fgv68s45dfs5d8f4cr','Bearer');
 */
function buildNewDevice(withingsDevice, serviceId, accessToken, refreshToken, tokenType) {
  // Build unique id for the device
  const uniqueId = uuid.v4();

  // Build params for all device
  const newParams = [
    {
      name: 'accessToken',
      value: accessToken,
    },
    {
      name: 'refreshToken',
      value: refreshToken,
    },
    {
      name: 'tokenType',
      value: tokenType,
    },
    {
      name: 'withingsDeviceId',
      value: withingsDevice.deviceid,
    },
  ];

  // Build features
  const newFeatures = [];
  // Feature allow in each device = battery
  newFeatures.push({
    name: 'Battery',
    selector: `withings-battery-${uniqueId}`,
    device_id: uniqueId,
    external_id: uniqueId,
    category: DEVICE_FEATURE_CATEGORIES.WITHINGS,
    type: DEVICE_FEATURE_TYPES.WITHINGS.BATTERY,
    read_only: false,
    keep_history: false,
    has_feedback: false,
    unit: '%',
    min: 0,
    max: 100,
  });

  const newDevice = {
    id: uniqueId,
    external_id: uniqueId,
    selector: `withings-${withingsDevice.model}-${uniqueId}`,
    name: `Withings - ${withingsDevice.model}`,
    room_id: null,
    service_id: serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_DAY,
    features: newFeatures,
    params: newParams,
  };

  return newDevice;
}

/**
 * @description  Build features of gladys device.
 *
 * @param {Object} currentGroup - Withings measure groups to transform.
 * @param {Object} device - Current device.
 * @param {Array} currentFeatures - CurrentFeature array to update if exist.
 * @returns {Array} Return array of features.
 * @example
 * withings.buildFeature({...}, {....}, null);
 */
function buildFeature(currentGroup, device, currentFeatures) {
  if (!device) {
    return null;
  }

  // Build (or get) feature corresponding to the measure
  let features = currentFeatures;
  if (!features) {
    features = [];
  }

  // Consider only real measures (not objectives) => category = 1
  if (currentGroup.category === 1) {
    currentGroup.measures.forEach((element) => {
      const gladysDeviceId = device.id;

      // Choose type of feature
      // (cf: https://developer.withings.com/oauth2/#tag/measure )
      let featureType;
      let featureName;
      let featureUnit;
      switch (element.type) {
        case 1:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.WEIGHT;
          featureName = 'Weight';
          featureUnit = 'kg';
          break;
        case 4:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.HEIGHT;
          featureName = 'Height';
          featureUnit = 'meter';
          break;
        case 5:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.FAT_FREE_MASS;
          featureName = 'Fat Free Mass';
          featureUnit = 'kg';
          break;
        case 6:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.FAT_RATIO;
          featureName = 'Fat Ratio';
          featureUnit = '%';
          break;
        case 8:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.FAT_MASS_WEIGHT;
          featureName = 'Fat Mass Weight';
          featureUnit = 'kg';
          break;
        case 9:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.DIASTOLIC_BLOOD_PRESSURE;
          featureName = 'Diastolic Blood Pressure';
          featureUnit = 'mmHg';
          break;
        case 10:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.SYSTOLIC_BLOOD_PRESSURE;
          featureName = 'Systolic Blood Pressure';
          featureUnit = 'mmHg';
          break;
        case 11:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.HEARTH_PULSE;
          featureName = 'Heart Pulse';
          featureUnit = 'bpm';
          break;
        case 12:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.TEMPERATURE;
          featureName = 'Temperature';
          featureUnit = 'celsius';
          break;
        case 54:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.SPO2;
          featureName = 'SpO2';
          featureUnit = '%';
          break;
        case 71:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.BODY_TEMPERATURE;
          featureName = 'Body Temperature';
          featureUnit = 'celsius';
          break;
        case 73:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.SKIN_TEMPERATURE;
          featureName = 'Skin Temperature';
          featureUnit = 'celsius';
          break;
        case 76:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.MUSCLE_MASS;
          featureName = 'Muscle Mass';
          featureUnit = 'kg';
          break;
        case 77:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.HYDRATION;
          featureName = 'Hydration';
          featureUnit = 'kg';
          break;
        case 88:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.BONE_MASS;
          featureName = 'Bone Mass';
          featureUnit = 'kg';
          break;
        case 91:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.PULSE_WAVE_VELOCITY;
          featureName = 'Pulse Wave Velocity';
          featureUnit = 'm/s';
          break;
        default:
          featureType = DEVICE_FEATURE_TYPES.WITHINGS.UNKNOWN;
          featureName = 'Unknown';
          featureUnit = '';
          break;
      }

      // Search existing feature
      let tmpFeature = features.find((feat) => feat.type === featureType);
      let isNewFeature = false;

      // if not exist build new
      if (!tmpFeature) {
        isNewFeature = true;
        const uniqueId = uuid.v4();
        tmpFeature = {
          id: uniqueId,
          name: featureName,
          selector: `withings-${featureName}-${gladysDeviceId}`,
          device_id: gladysDeviceId,
          external_id: `withings-${featureName}:${gladysDeviceId}:${uniqueId}`,
          category: DEVICE_FEATURE_CATEGORIES.WITHINGS,
          type: featureType,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          unit: featureUnit,
          min: 0,
          max: 0,
          feature_state: [],
        };
      }

      // Build a feature state
      const uniqueSateId = uuid.v4();
      const createDate = new Date(currentGroup.created * 1000);
      const featureState = {
        id: uniqueSateId,
        device_feature_id: tmpFeature.id,
        value: element.value * 10 ** element.unit,
        // created_at: `${createDate.getFullYear()}-${createDate.getMonth() + 1}-${createDate.getDate()}
        // ${createDate.getHours()}:${createDate.getMinutes()}:${createDate.getSeconds()}`,
        created_at: createDate,
        updated_at: new Date(),
      };

      tmpFeature.feature_state.push(featureState);

      if (isNewFeature) {
        features.push(tmpFeature);
      }
    });
  }

  return features;
}

/**
 * @description Build and save withings device with access_token response and init feature values.
 * @param {Object} accessTokenResponse - The access token response give by oauth2 controller buildTokenAccessUri.
 * @returns {Promise} Resolve with withings device added.
 * @example
 * withings.init(
 *  accessTokenResponse: {
 *    token_type: 'Bearer',
 *    access_token: 'b2f2c27f0bf3414e0fe3facfba7be9455109409a',
 *    refresh_token: 'f58e6331f741v5fe3facfba7be9455109409ae87',
 *  });
 */
async function init(accessTokenResponse) {
  const tokenType = accessTokenResponse.token_type;
  const accessToken = accessTokenResponse.access_token;
  const refreshToken = accessTokenResponse.refresh_token;
  const clientId = await this.gladys.variable.getValue(`WITHINGS_CLIENT_ID`, this.serviceId);
  const secretId = await this.gladys.variable.getValue(`WITHINGS_SECRET_ID`, this.serviceId);
  // logger.warn(accessTokenResponse);

  const { serviceId } = this;

  const oauth2Manager = new OAuth2Manager();

  const userResult = await oauth2Manager.executeQuery(
    accessToken,
    refreshToken,
    tokenType,
    'get',
    `${this.withingsUrl}/v2/user`,
    'action=getdevice',
  );

  logger.warn(userResult.data.body.devices);

  const devices = [];
  const mapOfDeviceByWithingsDeviceId = new Map();
  await userResult.data.body.devices.forEach((element) => {
    if (element) {
      // Build one gladys device for each withings device found
      const newDevice = buildNewDevice(element, serviceId, accessToken, refreshToken, tokenType, clientId, secretId);
      devices.push(newDevice);
      mapOfDeviceByWithingsDeviceId.set(element.deviceid, newDevice);
    }
  });

  const measureResult = await oauth2Manager.executeQuery(
    accessToken,
    refreshToken,
    tokenType,
    'get',
    `${this.withingsUrl}/measure`,
    'action=getmeas',
  );

  // logger.warn(measureResult.data.body);
  const mapOfMeasuresGrpsByWithingsDeviceId = new Map();
  await measureResult.data.body.measuregrps.forEach((element) => {
    if (element) {
      // Build map of measuregrps by withings device id
      let measureList = mapOfMeasuresGrpsByWithingsDeviceId.get(element.deviceid);
      if (!measureList) {
        measureList = [];
      }
      measureList.push(element);
      mapOfMeasuresGrpsByWithingsDeviceId.set(element.deviceid, measureList);
    }
  });

  const mapOfFeatureByWithingsDeviceId = new Map();
  await mapOfMeasuresGrpsByWithingsDeviceId.forEach(function buildFeatureByGrps(value, key) {
    value.forEach(function(currentGroup) {
      if (key) {
        const currentFeatures = mapOfFeatureByWithingsDeviceId.get(key);
        const features = buildFeature(currentGroup, mapOfDeviceByWithingsDeviceId.get(key), currentFeatures);
        if (features) {
          mapOfFeatureByWithingsDeviceId.delete(key);
          mapOfFeatureByWithingsDeviceId.set(key, features);
        }
      }
    });
  });

  // Save device with feature
  const { gladys } = this;
  await mapOfDeviceByWithingsDeviceId.forEach(function saveDevice(value, key) {
    if (key) {
      const arrayOfFeatures = mapOfFeatureByWithingsDeviceId.get(key);
      // Assign features to device
      value.features = value.features.concat(arrayOfFeatures);
      // Save all device (with feature)
      try {
        gladys.device.create(value);
      } catch (error) {
        logger.error(error);
      }
    }
  });

  return mapOfDeviceByWithingsDeviceId.values();
}

module.exports = {
  init,
};