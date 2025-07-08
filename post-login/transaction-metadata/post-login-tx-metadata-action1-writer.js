/**
 * Transaction Metadata demo
 *
 * Author: Amin Abbaspour
 * Date: 2025-07-08
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * NPM Dependencies:
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
const crypto = require('crypto');

exports.onExecutePostLogin = async (event, api) => {
    const uuid = crypto.randomUUID().toString();
    console.log(`setting tx metadata to ${uuid}`);
    api.transaction.setMetadata('uuid', uuid);

    /*
    const domain = event.request?.hostname;

    const continueUrl = `https://${domain}/continue`;
    const redirectUrl = `https://httpbin.org/anything?url=${continueUrl}`;

    console.log(`redirecting to ${redirectUrl}`);

    api.redirect.sendUserTo(redirectUrl);
    */

    //api.authentication.challengeWithAny([{type: 'otp'}]);

    //api.authentication.enrollWith({type: 'otp'});
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect. If your
 * onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onContinuePostLogin = async (event, api) => {
    const uuid = event?.transaction?.metadata?.uuid;
    console.log(`received tx metadata ${uuid}`);
    api.idToken.setCustomClaim('a1-uuid', uuid);
};
