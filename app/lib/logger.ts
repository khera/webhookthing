/**
 * map console.* functions to loggers. this should be replaced with something better, but there is
 * a dearth of loggers that work on Edge runtime. Notably, Winston does not.
 * 
 * NOTE: when testing, the LOG_LEVEL is set too late for this module, so tests must be run with `env LOG_LEVEL=debug npm run test`
 * if debug logs are desired.
 * 
 * we only care to support the following:
 * - error
 * - warn
 * - info (alias `log`)
 * - debug
 */

export const logger = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    log: console.log,
    debug: process.env.LOG_LEVEL === 'debug' ? console.debug : () => {}
};