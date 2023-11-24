/**
 * Send Phone Message MFA
 *
 * Author: Vikas Jayaram <vikas@okta.com>
 * Date: 2023-11-24
 * License: MIT (https://github.com/auth0/actions-galleryh/blob/main/LICENSE)
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
*/
exports.onExecutePreUserRegistration = async (event, api) => {
    var emailDomain = event.user.email.split('@')[1];
    var DENY_DOMAIN_LIST = ["disposable.com", "example.com"];
    if (DENY_DOMAIN_LIST.includes(emailDomain)) {
      api.access.deny('Something went wrong, please contact our support center.');
    }
  };