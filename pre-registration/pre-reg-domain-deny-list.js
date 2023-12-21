/**
 * Maintain a deny list of domains for sign up
 *
 * Author: Vikas Jayaram <vikas@okta.com>
 * Date: 2023-11-24
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
    console.log(`pre-reg event: ${JSON.stringify(event)}`);
    const emailDomain = event.user.email?.split('@')[1] || ''; // TODO: this is naive
    const DENY_DOMAIN_LIST = ['disposable.com', 'example.com'];
    if (DENY_DOMAIN_LIST.includes(emailDomain)) {
        api.access.deny('something went wrong', 'denied domain');
    }
};