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

    let add_contact_email;

    switch (add_contact) {
        case 'email': add_contact_email = true; break;
        case 'phone': add_contact_email = false; break;
        default:
            return noop('only add_contact type email or phone is supported');
    }

    if (add_contact_email) {
        // Check if user has already accepted privacy policies
        const hasVerifiedSecondaryEmail = user.app_metadata?.secondary_email &&
            user.app_metadata?.secondary_email_verified === true;

        if (hasVerifiedSecondaryEmail) {
            return noop('user already has a verified secondary email');
        }
    } else {
        // Check if user has already accepted privacy policies
        const hasVerifiedSecondaryPhone = user.app_metadata?.secondary_phone &&
            user.app_metadata?.secondary_email_phone === true;

        if (hasVerifiedSecondaryPhone) {
            return noop('user already has a verified secondary phone');
        }
    }

    // Get form ID from secret
    const formId = event.secrets.SECONDARY_CONTACT_FORM_ID;

    if (!formId) {
        return noop('SECONDARY_CONTACT_FORM_ID secret not configured');
    }

    if (MFA_REQUIRED_FOR_SECONDARY_CONTACT && canPromptMfa(event.user) && !hasDoneMfa(event)) {
        api.access.deny('MFA required but not completed');
        return;
    } else {
        console.log('mfa not required before adding email contact.');
    }

    // Render the privacy policy form
    api.prompt.render(formId, {
        vars: {
            client_id: event.secrets.client_id,
            client_secret: event.secrets.client_secret,
            auth0_domain: event.secrets.auth0_domain,
            flow_type: add_contact_email ? 'Email' : 'Phone'
        }
    });
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
