import { SelectListView } from 'atom-space-pen-views';
import _ from 'lodash';
import tildify from 'tildify';

import Config from './config';
import services from './jupyter-js-services-shim';
import WSKernel from './ws-kernel';
import uuid from 'uuid';

class CustomListView extends SelectListView {
  initialize(emptyMessage, onConfirmed) {
    this.emptyMessage = emptyMessage;
    this.onConfirmed = onConfirmed;
    super.initialize(...arguments);
    this.storeFocusedElement();
    if (this.panel == null) { this.panel = atom.workspace.addModalPanel({ item: this }); }
    this.panel.show();
    return this.focusFilterEditor();
  }

  getFilterKey() {
    return 'name';
  }

  destroy() {
    return this.cancel();
  }

  viewForItem(item) {
    let element = document.createElement('li');
    element.textContent = item.name;
    return element;
  }

  cancelled() {
    __guard__(this.panel, x => x.destroy());
    return this.panel = null;
  }

  confirmed(item) {
    __guardMethod__(this, 'onConfirmed', o => o.onConfirmed(item));
    return this.cancel();
  }

  getEmptyMessage() {
    return this.emptyMessage;
  }
}

export default class WSKernelPicker {
  constructor(onChosen) {
    this._onChosen = onChosen;
  }

  toggle(_grammar, _kernelSpecFilter) {
    this._grammar = _grammar;
    this._kernelSpecFilter = _kernelSpecFilter;
    let gateways = Config.getJson('gateways', []);
    if (_.isEmpty(gateways)) {
      atom.notifications.addError('No remote kernel gateways available', {
        description: 'Use the Hydrogen package settings to specify the list of remote servers. Hydrogen can use remote kernels on either a Jupyter Kernel Gateway or Jupyter notebook server.'
      });
      return;
    }

    this._path = atom.workspace.getActiveTextEditor().getPath() + '-' + uuid.v4();
    let gatewayListing = new CustomListView('No gateways available', this.onGateway.bind(this));
    this.previouslyFocusedElement = gatewayListing.previouslyFocusedElement;
    gatewayListing.setItems(gateways);
    return gatewayListing.setError('Select a gateway'); // TODO(nikita): maybe don't misuse error
  }

  onGateway(gatewayInfo) {
    return services.getKernelSpecs(gatewayInfo.options)
      .then(specModels => {
        let kernelSpecs = _.filter(specModels.kernelspecs, specModel => {
          return this._kernelSpecFilter(specModel.spec);
        });

        let kernelNames = _.map(kernelSpecs, specModel => specModel.name);

        let sessionListing = new CustomListView('No sessions available', this.onSession.bind(this));
        sessionListing.previouslyFocusedElement = this.previouslyFocusedElement;
        sessionListing.setLoading('Loading sessions...');

        return services.listRunningSessions(gatewayInfo.options)
          .then(function(sessionModels) {
              sessionModels = sessionModels.filter(function(model) {
                let name = __guard__(model.kernel, x => x.name);
                if (name != null) {
                  return kernelNames.includes(name);
                } else {
                  return true;
                }
              });
              let items = sessionModels.map(function(model) {
                if (__guard__(model.notebook, x => x.path) != null) {
                  var name = tildify(model.notebook.path);
                } else {
                  var name = `Session ${model.id}`;
                }
                return {
                  name,
                  model,
                  options: gatewayInfo.options
                };
              });
              items.unshift({
                name: '[new session]',
                model: null,
                options: gatewayInfo.options,
                kernelSpecs
              });
              return sessionListing.setItems(items);
            }

            , err => {
              // Gateways offer the option of never listing sessions, for security
              // reasons.
              // Assume this is the case and proceed to creating a new session.
              return this.onSession({
                name: '[new session]',
                model: null,
                options: gatewayInfo.options,
                kernelSpecs
              });
            }
          );
      }, err => atom.notifications.addError('Connection to gateway failed'));
  }


  onSession(sessionInfo) {
    if (sessionInfo.model == null) {
      let kernelListing = new CustomListView('No kernel specs available', this.startSession.bind(this));
      kernelListing.previouslyFocusedElement = this.previouslyFocusedElement;

      let items = _.map(sessionInfo.kernelSpecs, specModel => {
        let options = Object.assign({}, sessionInfo.options);
        options.kernelName = specModel.name;
        options.path = this._path;
        return {
          name: specModel.spec.display_name,
          options
        };
      });
      kernelListing.setItems(items);
      if (sessionInfo.name == null) {
        return kernelListing.setError('This gateway does not support listing sessions');
      }
    } else {
      return services.connectToSession(sessionInfo.model.id, sessionInfo.options).then(this.onSessionChosen.bind(this));
    }
  }

  startSession(sessionInfo) {
    return services.startNewSession(sessionInfo.options).then(this.onSessionChosen.bind(this));
  }

  onSessionChosen(session) {
    return session.kernel.getKernelSpec().then(kernelSpec => {
      let kernel = new WSKernel(kernelSpec, this._grammar, session);
      return this._onChosen(kernel);
    });
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}
