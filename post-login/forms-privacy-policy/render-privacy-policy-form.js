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
  const hasAcceptedPrivacyPolicies = user.app_metadata?.privacy_policies === true;

  if (!hasAcceptedPrivacyPolicies) {
    // Get form ID from secret
    const formId = event.secrets.PRIVACY_POLICY_FORM_ID;
    
    if (!formId) {
      console.error('PRIVACY_POLICY_FORM_ID secret not configured');
      return;
    }

    // Render the privacy policy form
    api.prompt.render(formId);
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
