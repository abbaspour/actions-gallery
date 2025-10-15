/**
 * @typedef {import('@auth0/actions/post-login/v3').Event} Event
 * @typedef {import('@auth0/actions/post-login/v3').PostLoginAPI} PostLoginAPI
 */

/**
 * renders a privacy policy form
 *
 * @param {Event} event
 * @param {PostLoginAPI} api
 * @returns {Promise<void>}
 */
exports.onExecutePostLogin = async (event, api) => {
  const { user } = event;

  // Check if user has already accepted privacy policies
  const hasVerifiedSecondaryEmail = user.app_metadata?.secondary_email &&
      user.app_metadata?.secondary_email_verified === true;

  if (!hasVerifiedSecondaryEmail) {
    // Get form ID from secret
    const formId = event.secrets.SECONDARY_EMAIL_FORM_ID;
    
    if (!formId) {
      console.error('SECONDARY_EMAIL_FORM_ID secret not configured');
      return;
    }

    // Render the privacy policy form
    api.prompt.render(formId, {
        vars: {
            client_id: event.secrets.client_id,
            client_secret: event.secrets.client_secret,
        }
    });
  }
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect. If your
 * onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onContinuePostLogin = async (event, api) => {
};
