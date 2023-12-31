/**
 * Check if phone number country is allowed to send SMS.
 *
 * Author: Vikas Jayaram <vikas@okta.com>
 * Date: 2023-12-20
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * Handler that will be called during the execution of a PreUserRegistration flow.
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
    const connection = event?.connection?.name;

    const ALLOWED_COUNTRY_CODES = ['AU'];

    function isPasswordlessAllowed(countryCode) {
        return ALLOWED_COUNTRY_CODES.includes(countryCode);
    }

    if (connection === 'sms') {
        const AwesomePhoneNumber = require('awesome-phonenumber');
        const {phone_number} = event?.user;
        const pn = new AwesomePhoneNumber(phone_number);
        const pwdUser = {
            country_code: pn.getCountryCode(),
            country: pn.getRegionCode(),
            phone_number: pn.getNumber('significant'),
            e164_phone_number: pn.getNumber(),
        };
        // send to splunk /sumo
        console.log(pwdUser);
        const isAllowed = isPasswordlessAllowed(pn.getRegionCode());
        if (!isAllowed) {
            api.access.deny('region-constraint', 'You are not allowed to register');
        }
    }
};
