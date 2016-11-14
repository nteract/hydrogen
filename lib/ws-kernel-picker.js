'use babel';

import { SelectListView } from 'atom-space-pen-views';
import _ from 'lodash';
import tildify from 'tildify';
import uuid from 'uuid';

import { __guard__, __guardMethod__ } from './guards';
import Config from './config';
import services from './jupyter-js-services-shim';
import WSKernel from './ws-kernel';

class CustomListView extends SelectListView {
  initialize(emptyMessage, onConfirmed) {
    this.emptyMessage = emptyMessage;
    this.onConfirmed = onConfirmed;
    super.initialize(...arguments);
    this.storeFocusedElement();
    if (this.panel == null) { this.panel = atom.workspace.addModalPanel({ item: this }); }
    this.panel.show();
    this.focusFilterEditor();
  }

  getFilterKey() {
    return 'name';
  }

  destroy() {
    this.cancel();
  }

  viewForItem(item) {
    const element = document.createElement('li');
    element.textContent = item.name;
    return element;
  }

  cancelled() {
    __guard__(this.panel, x => x.destroy());
    this.panel = null;
  }

  confirmed(item) {
    __guardMethod__(this, 'onConfirmed', o => o.onConfirmed(item));
    this.cancel();
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
    const gateways = Config.getJson('gateways', []);
    if (_.isEmpty(gateways)) {
      atom.notifications.addError('No remote kernel gateways available', {
        description: 'Use the Hydrogen package settings to specify the list of remote servers. Hydrogen can use remote kernels on either a Jupyter Kernel Gateway or Jupyter notebook server.',
      });
      return;
    }

    this._path = `${atom.workspace.getActiveTextEditor().getPath()}-${uuid.v4()}`;
    const gatewayListing = new CustomListView('No gateways available', this.onGateway.bind(this));
    this.previouslyFocusedElement = gatewayListing.previouslyFocusedElement;
    gatewayListing.setItems(gateways);
    gatewayListing.setError('Select a gateway'); // TODO(nikita): maybe don't misuse error
  }

  onGateway(gatewayInfo) {
    services.getKernelSpecs(gatewayInfo.options)
      .then((specModels) => {
        const kernelSpecs = _.filter(specModels.kernelspecs, specModel =>
          this._kernelSpecFilter(specModel.spec));

        const kernelNames = _.map(kernelSpecs, specModel => specModel.name);

        const sessionListing = new CustomListView('No sessions available', this.onSession.bind(this));
        sessionListing.previouslyFocusedElement = this.previouslyFocusedElement;
        sessionListing.setLoading('Loading sessions...');

        services.listRunningSessions(gatewayInfo.options)
          .then((sessionModels) => {
            sessionModels = sessionModels.filter((model) => {
              const name = __guard__(model.kernel, x => x.name);
              if (name != null) {
                return kernelNames.includes(name);
              }
              return true;
            });
            const items = sessionModels.map((model) => {
              let name;
              if (__guard__(model.notebook, x => x.path) != null) {
                name = tildify(model.notebook.path);
              } else {
                name = `Session ${model.id}`;
              }
              return {
                name,
                model,
                options: gatewayInfo.options,
              };
            });
            items.unshift({
              name: '[new session]',
              model: null,
              options: gatewayInfo.options,
              kernelSpecs,
            });
            return sessionListing.setItems(items);
          }, () =>
              // Gateways offer the option of never listing sessions, for security
              // reasons.
              // Assume this is the case and proceed to creating a new session.
               this.onSession({
                 name: '[new session]',
                 model: null,
                 options: gatewayInfo.options,
                 kernelSpecs,
               }),
          );
      }, () => atom.notifications.addError('Connection to gateway failed'));
  }


  onSession(sessionInfo) {
    if (sessionInfo.model == null) {
      const kernelListing = new CustomListView('No kernel specs available', this.startSession.bind(this));
      kernelListing.previouslyFocusedElement = this.previouslyFocusedElement;

      const items = _.map(sessionInfo.kernelSpecs, (specModel) => {
        const options = Object.assign({}, sessionInfo.options);
        options.kernelName = specModel.name;
        options.path = this._path;
        return {
          name: specModel.spec.display_name,
          options,
        };
      });
      kernelListing.setItems(items);
      if (sessionInfo.name == null) {
        kernelListing.setError('This gateway does not support listing sessions');
      }
    } else {
      services.connectToSession(sessionInfo.model.id, sessionInfo.options)
        .then(this.onSessionChosen.bind(this));
    }
  }

  startSession(sessionInfo) {
    services.startNewSession(sessionInfo.options)
      .then(this.onSessionChosen.bind(this));
  }

  onSessionChosen(session) {
    session.kernel.getKernelSpec().then((kernelSpec) => {
      const kernel = new WSKernel(kernelSpec, this._grammar, session);
      this._onChosen(kernel);
    });
  }
}
