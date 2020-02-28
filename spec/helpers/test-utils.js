"use babel";

// runAsync is borrowed and modified from link below.
// https://github.com/jasmine/jasmine/issues/923#issuecomment-169634461

/**
 * Allows async function syntax in jasmine beforeEach, etc
 * @example
 * beforeEach(
 *   waitAsync(async () => {
 *     await atom.packages.activatePackage("language-python");
 *   })
 *  );
 *
 *
 */
export function waitAsync(fn) {
  return done => {
    fn().then(done, function rejected(e) {
      fail(e);
      done();
    });
  };
}
