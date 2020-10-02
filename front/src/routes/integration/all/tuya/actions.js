import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let tuyaUsername;
      let tuyaPassword;
      try {
        tuyaUsername = await state.httpClient.get('/api/v1/service/tuya/variable/TUYA_EMAIL');
        if (tuyaUsername.value) {
          tuyaPassword = '*********'; // this is just used so that the field is filled
        }
      } finally {
        store.setState({
          tuyaUsername: (tuyaUsername || { value: '' }).value,
          tuyaPassword: tuyaPassword,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'tuyaPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectTuyaStatus: RequestStatus.Getting,
        tuyaConnected: false,
        tuyaConnectionError: undefined
      });
      try {
        await state.httpClient.post('/api/v1/service/tuya/variable/TUYA_EMAIL', {
          value: state.tuyaUsername
        });
        if (state.passwordChanges) {
          await state.httpClient.post('/api/v1/service/tuya/variable/TUYA_PASSWORD', {
            value: state.tuyaPassword
          });
        }
        await state.httpClient.post(`/api/v1/service/tuya/connect`);

        store.setState({
          connectTuyaStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ connectTuyaStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          connectTuyaStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayConnectedMessage(state) {
      // display 3 seconds a message "Tuya connected"
      store.setState({
        tuyaConnected: true,
        tuyaConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            tuyaConnected: false,
            connectTuyaStatus: undefined
          }),
        3000
      );
    },
    displayTuyaError(state, error) {
      store.setState({
        tuyaConnected: false,
        connectTuyaStatus: undefined,
        tuyaConnectionError: error
      });
    },
    async getTuyaDevices(state) {
      store.setState({
        getTuyaStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getTuyaOrderDir || 'asc'
        };
        if (state.tuyaSearch && state.tuyaSearch.length) {
          options.search = state.tuyaSearch;
        }

        const tuyaDevices = await state.httpClient.get('/api/v1/service/tuya/device', options);
        store.setState({
          tuyaDevices: tuyaDevices,
          getTuyaStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getTuyaStatus: e.message
        });
      }
    },
    async getDiscoveredTuyaDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/tuya/discover');
        store.setState({
          discoveredDevices,
          loading: false,
          errorLoading: false
        });
      } catch (e) {
        store.setState({
          loading: false,
          errorLoading: true
        });
      }
    },
    async getHouses(state) {
      store.setState({
        housesGetStatus: RequestStatus.Getting
      });
      try {
        const params = {
          expand: 'rooms'
        };
        const housesWithRooms = await state.httpClient.get(`/api/v1/house`, params);
        store.setState({
          housesWithRooms,
          housesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          housesGetStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceField(state, listName, index, field, value) {
      const devices = update(state[listName], {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        [listName]: devices
      });
    },
    updateFeatureProperty(state, listName, deviceIndex, featureIndex, property, value) {
      const devices = update(state[listName], {
        [deviceIndex]: {
          features: {
            [featureIndex]: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });

      store.setState({
        [listName]: devices
      });
    },
    async saveDevice(state, listName, index) {
      const device = state[listName][index];
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      const devices = update(state[listName], {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        [listName]: devices
      });
    },
    async deleteDevice(state, index) {
      const device = state.tuyaDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const tuyaDevices = update(state.tuyaDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        tuyaDevices
      });
    },
    async search(state, e) {
      store.setState({
        tuyaSearch: e.target.value
      });
      await actions.getTuyaDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getTuyaOrderDir: e.target.value
      });
      await actions.getTuyaDevices(store.getState());
    },
    addDiscoveredDevice(state, newDevice) {
      const existingDevices = state.discoveredDevices || [];
      const newDevices = [];

      let added = false;
      existingDevices.forEach(device => {
        if (device.external_id === newDevice.external_id) {
          newDevices.push(newDevice);
          added = true;
        } else {
          newDevices.push(device);
        }
      });

      if (!added) {
        newDevices.push(newDevice);
      }

      store.setState({
        discoveredDevices: newDevices,
        loading: false
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
