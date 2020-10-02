import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../actions';
import TuyaPage from '../TuyaPage';
import SetupTab from './SetupTab';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

@connect(
  'user,session,tuyaUsername,tuyaPassword,connectTuyaStatus,tuyaConnected,tuyaConnectionError',
  actions
)
class TuyaSetupPage extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('tuya');
    this.props.loadProps();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.TUYA.CONNECTED, () =>
      this.props.displayConnectedMessage()
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.TUYA.ERROR, payload =>
      this.props.displayTuyaError(payload)
    );
  }

  render(props, {}) {
    return (
      <TuyaPage>
        <SetupTab {...props} />
      </TuyaPage>
    );
  }
}

export default TuyaSetupPage;
