/** The data returned by `jupyter --paths --json` */
export interface JupyterPaths {
  /** Paths: all the Jupyter Data Dirs */
  data: Array<string>;

  /** RuntimeDir */
  runtime: Array<string>;

  config: Array<string>;
}

/** Ask Jupyter where the paths are using `jupyter --paths --json` */
export declare function askJupyter(): Promise<JupyterPaths>;

interface Options {
  /** Ask Jupyter where the paths are */
  askJupyter: boolean;
  /**
   * Include the sys.prefix paths When {options.withSysPrefix} is set,
   * `dataDirs` returns a promise of directories
   */
  withSysPrefix: boolean;
}

/**
 * DataDirs returns all the expected static directories for this OS. The user of
 * this function should make sure to make sure the directories exist.
 *
 * @example
 *
 * ```js
 *  > jp.dataDirs()
 *  [ '/Users/rgbkrk/Library/Jupyter',
 *    '/usr/share/jupyter',
 *    '/usr/local/share/jupyter' ]
 * ```
 *
 * When {options.withSysPrefix} is set, this returns a promise of directories
 *
 * If you want the paths to include the `sys.prefix` paths (for Anaconda
 * installs), an optional `opts` parameter is accepted with key `withSysPrefix`.
 * This changes the return to a promise for you instead.
 *
 * @example
 *
 * ```js
 * jp.dataDirs({ withSysPrefix: true }).then(console.log);
 * ```
 *
 * Promise { <pending> } [ '/Users/rgbkrk/Library/Jupyter',
 * '/usr/local/Cellar/python/2.7.11/Frameworks/Python.framework/Versions/2.7/share/jupyter',
 * '/usr/share/jupyter', '/usr/local/share/jupyter' ]
 *
 * @returns All the Jupyter Data Dirs
 */
export declare function dataDirs(options?: Options): Promise<Array<string>>;

/**
 * Returns immediately with the path to running kernels
 *
 * @example Jp.runtimeDir() //-> '/Users/rgbkrk/Library/Jupyter/runtime'
 */
export declare function runtimeDir(): string;

/**
 * Like `dataDirs`, an optional `options` parameter is accepted with key
 * `withSysPrefix` as an argument.
 *
 * ```JavaScript
 * > jp.configDirs({ withSysPrefix: true }).then(console.log)
 * Promise { <pending> }
 * > [ '/Users/rgbkrk/.jupyter',
 *   '/usr/local/Cellar/python/2.7.11/Frameworks/Python.framework/Versions/2.7/etc/jupyter',
 *   '/usr/local/etc/jupyter',
 *   '/etc/jupyter' ]
 * ```
 */
export declare function configDirs(options?: Options): Promise<Array<string>>;
