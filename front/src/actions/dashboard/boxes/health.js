import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
// import createDeviceActions from '../../device';
import update from 'immutability-helper';
import get from 'get-value';
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../../server/utils/constants');

const BOX_KEY = 'DevicesInRoom';

const getLightStatus = room => {
  let roomLightStatus = 0;
  let hasBinaryLightDeviceFeature = false;
  room.devices.forEach(device => {
    device.features.forEach(feature => {
      // if it's a light
      const isLight =
        feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
        feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY &&
        feature.read_only === false;
      // if it's a light and it's turned on, we consider that the light
      // is on in the room
      if (isLight && feature.last_value === 1) {
        roomLightStatus = 1;
      }
      if (isLight) {
        hasBinaryLightDeviceFeature = true;
      }
    });
  });
  return {
    roomLightStatus,
    hasBinaryLightDeviceFeature
  };
};

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    async getHealth(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        // TODO recup les info de type health pourles afficher
        const room = await state.httpClient.get(`/api/v1/room/${box.room}?expand=devices`);
        // we test if there are lights ON/OFF device features to control in this room
        const { hasBinaryLightDeviceFeature, roomLightStatus } = getLightStatus(room);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          room,
          hasBinaryLightDeviceFeature,
          roomLightStatus
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    deviceFeatureWebsocketEvent(state, x, y, payload) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const devices = get(data, 'room.devices');
      if (devices) {
        let found = false;
        let currentDeviceIndex = 0;
        let currentFeatureIndex = 0;
        while (!found && currentDeviceIndex < devices.length) {
          while (!found && currentFeatureIndex < devices[currentDeviceIndex].features.length) {
            if (
              devices[currentDeviceIndex].features[currentFeatureIndex].selector === payload.device_feature_selector
            ) {
              found = true;
              const newData = update(data, {
                room: {
                  devices: {
                    [currentDeviceIndex]: {
                      features: {
                        [currentFeatureIndex]: {
                          last_value: {
                            $set: payload.last_value
                          },
                          last_value_changed: {
                            $set: payload.last_value_changed
                          }
                        }
                      }
                    }
                  }
                }
              });
              const { hasBinaryLightDeviceFeature, roomLightStatus } = getLightStatus(newData.room);
              boxActions.mergeBoxData(state, BOX_KEY, x, y, {
                room: newData.room,
                hasBinaryLightDeviceFeature,
                roomLightStatus
              });
            }
            currentFeatureIndex += 1;
          }
          currentDeviceIndex += 1;
          currentFeatureIndex = 0;
        }
      }
    }
  };
  return Object.assign({}, actions, boxActions);
}

export default createActions;
