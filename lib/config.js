/* @flow */

const Config = {
  getJson(key: string, _default: Object = {}) {
    const value = atom.config.get(`Hydrogen.${key}`);
    if (!value || typeof value !== "string") return _default;
    try {
      return JSON.parse(value);
    } catch (error) {
      const message = `Your Hydrogen config is broken: ${key}`;
      atom.notifications.addError(message, { detail: error });
    }
    return _default;
  },

  schema: {
    kernelspec: {},
    autocomplete: {
      title: "Enable Autocomplete",
      includeTitle: false,
      description:
        "If enabled, use autocomplete options provided by the current kernel.",
      type: "boolean",
      default: true
    },
    autoScroll: {
      title: "Enable Autoscroll",
      includeTitle: false,
      description:
        "If enabled, Hydrogen will automatically scroll to the bottom of the result view.",
      type: "boolean",
      default: true
    },
    outputAreaFontSize: {
      title: "Output area fontsize",
      includeTitle: false,
      description: "Change the fontsize of the Output area.",
      type: "integer",
      minimum: 0,
      default: 0
    },
    debug: {
      title: "Enable Debug Messages",
      includeTitle: false,
      description: "If enabled, log debug messages onto the dev console.",
      type: "boolean",
      default: false
    },
    startDir: {
      title: "Directory to start kernel in",
      includeTitle: false,
      description: "Restart the kernel for changes to take effect.",
      type: "string",
      enum: [
        {
          value: "firstProjectDir",
          description: "The first started project's directory (default)"
        },
        {
          value: "projectDirOfFile",
          description: "The project directory relative to the file"
        },
        {
          value: "dirOfFile",
          description: "Current directory of the file"
        }
      ],
      default: "firstProjectDir"
    },
    kernelNotifications: {
      title: "Enable Kernel Notifications",
      includeTitle: false,
      description:
        "Notify if kernels writes to stdout. By default, kernel notifications are only displayed in the developer console.",
      type: "boolean",
      default: false
    },
    gateways: {
      title: "Kernel Gateways",
      includeTitle: false,
      description:
        'Hydrogen can connect to remote notebook servers and kernel gateways. Each gateway needs at minimum a name and a value for options.baseUrl. The options are passed directly to the `jupyter-js-services` npm package, which includes documentation for additional fields. Example value: ``` [{ "name": "Remote notebook", "options": { "baseUrl": "http://mysite.com:8888" } }] ```',
      type: "string",
      default: "[]"
    },
    languageMappings: {
      title: "Language Mappings",
      includeTitle: false,
      description:
        'Custom Atom grammars and some kernels use non-standard language names. That leaves Hydrogen unable to figure out what kernel to start for your code. This field should be a valid JSON mapping from a kernel language name to Atom\'s grammar name ``` { "kernel name": "grammar name" } ```. For example ``` { "scala211": "scala", "javascript": "babel es6 javascript", "python": "magicpython" } ```.',
      type: "string",
      default: "{}"
    },
    startupCode: {
      title: "Startup Code",
      includeTitle: false,
      description:
        'This code will be executed on kernel startup. Format: `{"kernel": "your code \\nmore code"}`. Example: `{"Python 2": "%matplotlib inline"}`',
      type: "string",
      default: "{}"
    },
    outputAreaDock: {
      title: "Leave output dock open",
      description:
        "Do not close dock when switching to an editor without a running kernel",
      type: "boolean",
      default: false
    },
    outputAreaDefault: {
      title: "View output in the dock by default",
      description:
        "If enabled, output will be displayed in the dock by default rather than inline",
      type: "boolean",
      default: false
    },
    statusBarDisable: {
      title: "Disable the Hydrogen status bar",
      type: "boolean",
      default: false
    }
  }
};

export default Config;
