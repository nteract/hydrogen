/* @flow */

// @jupyterlab/services apparently require overriding globals, as explained in its
// README: https://github.com/jupyterlab/services
// Otherwise, any requests it sends are blocked due to CORS issues
//
// This file exists to
// a) Make sure globals are only ever overridden once
// b) In the future, try to make the global overrides optional if gateways are
//    not used, or have been pre-configured to avoid CORS issues

import ws from "ws";
import xhr from "xmlhttprequest";
import requirejs from "requirejs";

global.requirejs = requirejs;
global.XMLHttpRequest = xhr.XMLHttpRequest;
global.WebSocket = ws;

export { Kernel, Session } from "@jupyterlab/services";
