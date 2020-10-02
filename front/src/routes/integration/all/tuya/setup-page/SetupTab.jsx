import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

const SetupTab = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">
          <Text id="integration.tuya.setup.title" />
        </h1>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: props.connectTuyaStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <p>
              <Text id="integration.tuya.setup.description" />
            </p>
            {props.connectTuyaStatus === RequestStatus.Error && (
              <p class="alert alert-danger">
                <Text id="integration.tuya.setup.error" />
              </p>
            )}
            {props.connectTuyaStatus === RequestStatus.Success && !props.tuyaConnected && (
              <p class="alert alert-info">
                <Text id="integration.tuya.setup.connecting" />
              </p>
            )}
            {props.tuyaConnected && (
              <p class="alert alert-success">
                <Text id="integration.tuya.setup.connected" />
              </p>
            )}
            {props.tuyaConnectionError && (
              <p class="alert alert-danger">
                <Text id="integration.tuya.setup.connectionError" />
              </p>
            )}
            <form>
              <div class="form-group">
                <label for="tuyaUsername" class="form-label">
                  <Text id={`integration.tuya.setup.userLabel`} />
                </label>
                <Localizer>
                  <input
                    name="tuyaUsername"
                    placeholder={<Text id="integration.tuya.setup.userPlaceholder" />}
                    value={props.tuyaUsername}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="form-group">
                <label for="tuyaPassword" class="form-label">
                  <Text id={`integration.tuya.setup.passwordLabel`} />
                </label>
                <Localizer>
                  <input
                    name="tuyaPassword"
                    type="password"
                    placeholder={<Text id="integration.tuya.setup.passwordPlaceholder" />}
                    value={props.tuyaPassword}
                    class="form-control"
                    onInput={props.updateConfigration}
                  />
                </Localizer>
              </div>

              <div class="row mt-5">
                <div class="col">
                  <button type="submit" class="btn btn-success" onClick={props.saveConfiguration}>
                    <Text id="integration.tuya.setup.saveLabel" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupTab;
