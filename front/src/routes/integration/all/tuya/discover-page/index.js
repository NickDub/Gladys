import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import TuyaPage from '../TuyaPage';
import DiscoverTab from './DiscoverTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect('user,session,httpClient,housesWithRooms,discoveredDevices,loading,errorLoading', actions)
class TuyaIntegration extends Component {
  async componentWillMount() {
    this.props.getDiscoveredTuyaDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('tuya');

    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.TUYA.NEW_DEVICE,
      this.props.addDiscoveredDevice
    );
  }

  render(props) {
    return (
      <TuyaPage user={props.user}>
        <DiscoverTab {...props} />
      </TuyaPage>
    );
  }
}

export default TuyaIntegration;
