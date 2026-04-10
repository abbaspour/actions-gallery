/**
 * @typedef {import('@auth0/actions/post-login/v3').Event} Event
 * @typedef {import('@auth0/actions/post-login/v3').PostLoginAPI} PostLoginAPI
 */

const logger = require('actions:logger');

/**
 * dump event
 *
 * @param {Event} event
 * @param {PostLoginAPI} api
 * @returns {Promise<void>}
 */
exports.onExecutePostLogin = async (event, api) => {
    logger.log(JSON.stringify(event));
};