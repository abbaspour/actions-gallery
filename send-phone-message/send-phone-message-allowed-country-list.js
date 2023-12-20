/**
 * Send Phone Message MFA with Twilio
 *
 * Author: Vikas Jayaram <vikas@okta.com>
 * Date: 2023-11-24
 * License: MIT (https://github.com/auth0/actions-galleryh/blob/main/LICENSE)
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {SendPhoneMessageAPI} api - Methods and utilities to help change the behavior of sending a phone message.
 */
const PhoneNumber = require('awesome-phonenumber');

exports.onExecuteSendPhoneMessage = async (event, api) => {
    const accountSid = event.secrets.TWILIO_ACCOUNT_SID;
    const authToken = event.secrets.TWILIO_AUTH_TOKEN;
    const fromPhoneNumber = event.secrets.TWILIO_PHONE_NUMBER;

    const twilioClient = require('twilio')(accountSid, authToken);
    const {action, text, recipient, message_type} = event.message_options;
    const ALLOWED_COUNTRY_CODES = ['AU'];
    const pn = new PhoneNumber(recipient);
    const mfaUser = {
        action: action,
        message_type: message_type,
        country_code: pn.getCountryCode(),
        country: pn.getRegionCode(),
        phone_number: pn.getNumber('significant'),
        e164_phone_number: pn.getNumber(),
        auth0_user_id: event.user.user_id,
        email: event.user.email
    };

    // send mfaUser to splunk / sumo for logging.

    function isEnrollmentAllowed(countryCode) {
        return ALLOWED_COUNTRY_CODES.includes(countryCode);
    }

    async function sendSMSToGateway(body, from, to) {
        return new Promise((resolve, reject) => {
            twilioClient.messages.create({
                body: body,
                from: from,
                to: to,
            }).then(message => {
                resolve(message);
            }).catch(error => {
                reject(error);
            });
        });
    }

    async function enrollment(countryCode, body, from, to) {
        try {
            const isAllowed = isEnrollmentAllowed(countryCode);
            if (isAllowed) {
                const messageResponse = await sendSMSToGateway(body, from, to);
            } else {
                const errMsg = `Someone tried to enroll with phone number ${recipient}  from country ${countryCode}`;
                throw new Error(errMsg);
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    async function send2FA(countryCode, body, from, to) {
        try {
            const messageResponse = await sendSMSToGateway(body, from, to);
        } catch (e) {
            throw new Error(e);
        }
    }

    switch (action) {
        case 'enrollment':
            await enrollment(pn.getRegionCode(), text, fromPhoneNumber, recipient);
            break;
        case 'second-factor-authentication':
            await send2FA(pn.getRegionCode(), text, fromPhoneNumber, recipient);
            break;
        default:
            break;
    }
};