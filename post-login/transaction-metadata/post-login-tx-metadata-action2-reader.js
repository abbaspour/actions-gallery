/**
 * Transaction Metadata demo
 *
 * Author: Amin Abbaspour
 * Date: 2025-07-08
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
    const uuid = event?.transaction?.metadata?.uuid;
    console.log(`received tx metadata ${uuid}`);
    api.idToken.setCustomClaim('a2-uuid', uuid);
};
