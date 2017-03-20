/* @flow */

const Config = {
  getJson(key: string, _default: Object = {}) {
    const value = atom.config.get(`Hydrogen.${key}`);
    if (!value || typeof value !== 'string') return _default;
    try {
      return JSON.parse(value);
    } catch (error) {
      const message = `Your Hydrogen config is broken: ${key}`;
      atom.notifications.addError(message, { detail: error });
    }
    return _default;
  },

  schema: {
    autocomplete: {
      title: 'Enable Autocomplete',
      includeTitle: false,
      description: 'If enabled, use autocomplete options provided by the current kernel.',
      type: 'boolean',
      default: true,
    },
    debug: {
      title: 'Enable Debug Messages',
      includeTitle: false,
      description: 'If enabled, log debug messages onto the dev console.',
      type: 'boolean',
      default: false,
    },
    kernelNotifications: {
      title: 'Enable Kernel Notifications',
      includeTitle: false,
      description: 'Notify if kernels writes to stdout. By default, kernel notifications are only displayed in the developer console.',
      type: 'boolean',
      default: false,
    },
    gateways: {
      title: 'Kernel Gateways',
      includeTitle: false,
      description: 'Hydrogen can connect to remote notebook servers and kernel gateways. Each gateway needs at minimum a name and a value for options.baseUrl. The options are passed directly to the `jupyter-js-services` npm package, which includes documentation for additional fields. Example value: ``` [{ "name": "Remote notebook", "options": { "baseUrl": "http://mysite.com:8888" } }] ```',
      type: 'string',
      default: '[]',
    },
    kernelspec: {
      title: 'Kernel Specs',
      includeTitle: false,
      description: 'This field is populated on every launch or by invoking the command `hydrogen:update-kernels`. It contains the JSON string resulting from running `jupyter kernelspec list --json` or `ipython kernelspec list --json`. You can also edit this field and specify custom kernel specs , like this: ``` { "kernelspecs": { "ijavascript": { "spec": { "display_name": "IJavascript", "env": {}, "argv": [ "node", "/home/user/node_modules/ijavascript/lib/kernel.js", "--protocol=5.0", "{connection_file}" ], "language": "javascript" }, "resources_dir": "/home/user/node_modules/ijavascript/images" } } } ```',
      type: 'string',
      default: '{}',
    },
    languageMappings: {
      title: 'Language Mappings',
      includeTitle: false,
      description: 'Some kernels may use a non-standard language name (e.g. jupyter-scala sets the language name to `scala211`). That leaves Hydrogen unable to figure out what kernel for your code. This field should be a valid JSON mapping from a kernel language name to Atom\'s lower-cased grammar name, e.g. ``` { "scala211": "scala", "Elixir": "elixir" } ```',
      type: 'string',
      default: '{}',
    },
    startupCode: {
      title: 'Startup Code',
      includeTitle: false,
      description: 'This code will be executed on kernel startup. Format: `{"kernel": "your code \\nmore code"}`. Example: `{"Python 2": "%matplotlib inline"}`',
      type: 'string',
      default: '{}',
    },
  },
};

export default Config;
