'use babel';

/* eslint-disable no-console */
export default function log(...message) {
  if (atom.inDevMode() || atom.config.get('Hydrogen.debug')) {
    console.debug('Hydrogen:', ...message);
  }
}
