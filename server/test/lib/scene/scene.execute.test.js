const { assert, fake, createSandbox } = require('sinon');
const EventEmitter = require('events');
const { expect } = require('chai');
const { ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const light = {
  turnOn: fake.resolves(null),
};

describe('SceneManager', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should execute one scene', async () => {
    const stateManager = new StateManager(event);
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    await sceneManager.execute('my-scene');
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledOnce(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
  it('should execute one scene and abort scene', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [
              {
                variable: '0.0.last_value',
                operator: '=',
                value: 20,
              },
            ],
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    const scope = {};
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.notCalled(device.setValue);
          expect(scope).to.have.property('0');
          expect(scope['0']).to.deep.equal({ '0': { category: 'light', type: 'binary', last_value: 15 } });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
  it('should execute one scene, crash but not crash here', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: 'this type does not exist',
            device_feature: 'my-device-feature',
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    const scope = {};
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        resolve();
      });
    });
  });
  it('scene does not exist', async () => {
    const sceneManager = new SceneManager(light, event);
    return sceneManager.execute('thisscenedoesnotexist');
  });
  it('should execute chained scenes', async () => {
    const stateManager = new StateManager(event);
    const sceneManager = new SceneManager(stateManager, event);

    const executeSpy = sandbox.spy(sceneManager, 'execute');
    const scope = {};
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'second-scene',
          },
        ],
      ],
    };
    const secondScene = {
      selector: 'second-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'my-scene',
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    sceneManager.addScene(secondScene);
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledTwice(executeSpy);
          assert.calledWith(executeSpy.firstCall, 'my-scene', scope);
          assert.calledWith(executeSpy.secondCall, 'second-scene', scope);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should deduplicate calls to other scenes', async () => {
    const stateManager = new StateManager(event);
    const sceneManager = new SceneManager(stateManager, event);

    const executeSpy = sandbox.spy(sceneManager, 'execute');
    const scope = {};
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'second-scene',
          },
          {
            type: ACTIONS.SCENE.START,
            scene: 'second-scene',
          },
        ],
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'second-scene',
          },
          {
            type: ACTIONS.SCENE.START,
            scene: 'second-scene',
          },
        ],
      ],
    };
    const secondScene = {
      selector: 'second-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'my-scene',
          },
          {
            type: ACTIONS.SCENE.START,
            scene: 'my-scene',
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    sceneManager.addScene(secondScene);
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledTwice(executeSpy);
          assert.calledWith(executeSpy.firstCall, 'my-scene', scope);
          assert.calledWith(executeSpy.secondCall, 'second-scene', scope);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
