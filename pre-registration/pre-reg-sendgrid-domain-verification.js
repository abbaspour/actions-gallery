/**
 * Check domain reputation with Sendgrid API.
 *
 * Author: Vikas Jayaram <vikas@okta.com>
 * Date: 2023-11-24
 * License: MIT (https://github.com/auth0/actions-galleryh/blob/main/LICENSE)
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
*/
const client = require('@sendgrid/client');
exports.onExecutePreUserRegistration = async (event, api) => {
    const ERROR_MESSAGE = 'Something went wrong, please contact our support center.';
    async function checkReputation(body) {
        const { verdict, score, checks, additional } = body;
        if (checks.domain.has_valid_address_syntax && checks.domain.has_mx_or_a_record && !checks.domain.is_suspected_disposable_address) {
            return true;
        } else {
            return false;
        }
    }
    // https://docs.sendgrid.com/api-reference/e-mail-address-validation/validate-an-email
    client.setApiKey(event.secrets.SENDGRID_API_KEY);

    const data = {
        "email": event.user.email,
        "source": "signup"
    };

    const request = {
        url: `/v3/validations/email`,
        method: 'POST',
        body: data
    }

    client.request(request)
        .then(([response, body]) => {
            checkReputation(body)
                .then((isAllowedToSignup) => {
                    if (!isAllowedToSignup) {
                        return api.access.deny(ERROR_MESSAGE);
                    }
                })
                .catch(er => {
                    console.log(er);
                    return api.access.deny(ERROR_MESSAGE);
                })
        })
        .catch(error => {
            console.error(error);
            api.access.deny(ERROR_MESSAGE);
        });
};