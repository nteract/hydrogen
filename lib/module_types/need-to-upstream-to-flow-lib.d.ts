// TODO determine if this is needed for TypeScript

/**
 * Adapted from https://github.com/facebook/nuclide/tree/master/flow-libs
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/*
 * APIs listed in this file are ones that should be built into Flow and need to be upstreamed.
 */
type IDisposable = {
  dispose(): unknown;
};

/*
 * These Notification & NotificationOptions definitions are not exhaustive while standardization,
 * browser, and Electron support remain incomplete.
 */
type NotificationOptions = {
  body?: string;
  icon?: string;
};

declare class Notification {
  constructor(message: string, options?: NotificationOptions): void;
  onclick: () => void;
}

// T9254051 - Fix flow http/https definitions.
declare class http$fixed$Server extends events$EventEmitter {
  listen(
    port: number,
    hostname?: string,
    backlog?: number,
    callback?: (...args: Array<any>) => any
  ): http$fixed$Server;
  listen(
    path: string,
    callback?: (...args: Array<any>) => any
  ): http$fixed$Server;
  listen(
    handle: Record<string, any>,
    callback?: (...args: Array<any>) => any
  ): http$fixed$Server;
  close(callback?: (...args: Array<any>) => any): http$fixed$Server;
  address(): {
    port: number;
    fmaily: string;
    address: string;
  };
  maxHeadersCount: number;
}

declare class http$fixed$IncomingMessage extends stream$Readable {
  headers: Record<string, any>;
  httpVersion: string;
  method: string;
  trailers: Record<string, any>;
  setTimeout(msecs: number, callback: (...args: Array<any>) => any): void;
  socket: any;
  // TODO net.Socket
  statusCode: number;
  url: string;
  connection: {
    destroy: () => void;
  };
}

declare class http$fixed$ClientRequest extends stream$Writable {}

declare class http$fixed$ServerResponse {
  setHeader(name: string, value: string): void;
  statusCode: number;
  write(value: string): void;
  end(): void;
}

declare class https$fixed {
  Server: typeof http$fixed$Server;
  createServer(
    options: Record<string, any>,
    requestListener?: (
      request: http$fixed$IncomingMessage,
      response: http$fixed$ServerResponse
    ) => void
  ): http$fixed$Server;
  request(
    options: Record<string, any> | string,
    callback: (response: http$fixed$IncomingMessage) => void
  ): http$fixed$ClientRequest;
  get(
    options: Record<string, any> | string,
    callback: (response: http$fixed$IncomingMessage) => void
  ): http$fixed$ClientRequest;
}

declare class http$fixed {
  Server: typeof http$fixed$Server;
  createServer(
    requestListener?: (
      request: http$fixed$IncomingMessage,
      response: http$fixed$ServerResponse
    ) => void
  ): http$fixed$Server;
  request(
    options: Record<string, any> | string,
    callback: (response: http$fixed$IncomingMessage) => void
  ): http$fixed$ClientRequest;
  get(
    options: Record<string, any> | string,
    callback: (response: http$fixed$IncomingMessage) => void
  ): http$fixed$ClientRequest;
}

declare class module$Module {
  constructor(id?: string, parent?: string | module$Module): void;
  id: string | null | undefined;
  exports: any;
  parent?: string | module$Module;
  filename?: string;
  loaded: boolean;
  children: Array<module$Module>;
  paths: Array<string>;
  _compile: (content: string, filename: string) => void;
  _resolveFilename(filename: string, module: any): string;
}

declare interface net$ListenOptions {
  port?: number;
  host?: string;
  backlog?: number;
  path?: string;
  exclusive?: boolean;
}
export declare var module: module$Module;
