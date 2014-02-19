/**
 * Allows the use of zjs in a node env.
 *
 * zjs should not be used server-side: this is just an adapter
 * for zjs and z-kit's console apps.
 */

module.exports = require('./dist/z');