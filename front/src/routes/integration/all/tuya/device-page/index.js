import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import TuyaPage from '../TuyaPage';
import DeviceTab from './DeviceTab';

@connect('user,tuyaDevices,housesWithRooms,getTuyaStatus', actions)
class TuyaIntegration extends Component {
  componentWillMount() {
    this.props.getTuyaDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('tuya');
  }

  render(props, {}) {
    return (
      <TuyaPage user={props.user}>
        <DeviceTab {...props} />
      </TuyaPage>
    );
  }
}

export default TuyaIntegration;
