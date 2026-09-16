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

    if (event.connection.name !== 'Email-OTP') return;


    // Check if we know enough about user
    const kycExists = user.user_metadata?.first_name && user.user_metadata?.last_name && user.user_metadata?.company_name;

    if (!kycExists) {
        // Get form ID from secret
        const formId = event.secrets.KYC_FORM_ID;

        if (!formId) {
            console.error('KYC_FORM_ID secret not configured');
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
