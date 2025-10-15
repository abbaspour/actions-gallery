// noinspection JSUnusedLocalSymbols

const MFA_REQUIRED_FOR_SECONDARY_CONTACT = true;
/**
 * @typedef {import('@auth0/actions/post-login/v3').Event} Event
 * @typedef {import('@auth0/actions/post-login/v3').PostLoginAPI} PostLoginAPI
 */

const canPromptMfa = (user) => user.enrolledFactors && user.enrolledFactors.length > 0;
const hasDoneMfa = (event) => event.authentication.methods.some(m => m.name === 'mfa');
const mapEnrolledToFactors = (user) => user.enrolledFactors.map(f => (f.method === 'sms' ? {
    type: 'phone',
    options: {preferredMethod: 'sms'}
} : {type: f.method}));

const interactive_login = new RegExp('^oidc-');

/**
 * renders a privacy policy form
 *
 * @param {Event} event
 * @param {PostLoginAPI} api
 * @returns {Promise<void>}
 */
exports.onExecutePostLogin = async (event, api) => {

    const noop = api.noop || function (x) { // facilitate unit testing
        console.log(x);
    };

    const protocol = event?.transaction?.protocol || 'unknown';

    if (!interactive_login.test(protocol)) {
        return noop(`protocol is not interactive: ${protocol}`);
    }

    const {add_contact, change_contact} = event.request.query || {};

    if (!add_contact && !change_contact) {
        return noop('no add or change contact requested');
    }

    const {user} = event;

    if (add_contact !== 'email') {
        return noop('only add_contact type email is supported');
    }

    // Check if user has already accepted privacy policies
    const hasVerifiedSecondaryEmail = user.app_metadata?.secondary_email &&
        user.app_metadata?.secondary_email_verified === true;

    if (hasVerifiedSecondaryEmail) {
        return noop('user already has a verified secondary email');
    }

    // Get form ID from secret
    const formId = event.secrets.SECONDARY_EMAIL_FORM_ID;

    if (!formId) {
        return noop('SECONDARY_EMAIL_FORM_ID secret not configured');
    }

    if (MFA_REQUIRED_FOR_SECONDARY_CONTACT && canPromptMfa(event.user) && !hasDoneMfa(event)) {
        console.log(`MFA before adding email contact:  ${JSON.stringify(event.user.enrolledFactors)}`);
        api.authentication.challengeWithAny(event.user.enrolledFactors/*mapEnrolledToFactors(event.user)*/);
    } else {
        console.log('mfa not required before adding email contact.');
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
