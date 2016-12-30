'use babel';

/* eslint-disable no-console */
export default function log(...message) {
  if (atom.inDevMode() === true) {
    console.debug('Hydrogen', ...message);
  }
}
