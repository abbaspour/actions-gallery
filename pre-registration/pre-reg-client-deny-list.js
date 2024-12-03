/*
 * Maintain a deny list of clients for sign up
 *
 * Author: Amin Abbaspour
 * Date: 2024-11-24
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
    if (event.client.metadata?.partner === 'true') {
        api.access.deny('signup error', 'signup unsupported from this client');
    }
};