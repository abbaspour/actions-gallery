/**
 * Fetch CRM id post Login
 *
 * Author: Amin Abbaspour
 * Date: 2023-11-22
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param event https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object
 * @param api https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object
 * @returns {Promise<void>}
 *
 * NPM Dependencies:
 *  - axios
 */
exports.onExecutePostLogin = async (event, api) => {

    const {email, app_metadata: {customer_id: existing_customer_id}} = event.user;

    if (existing_customer_id) {
        api.idToken.setCustomClaim('customer_id', existing_customer_id);
        return;
    }

    const axios = require('axios');
    const crypto = require('crypto');

    const email_hash = crypto.createHash('md5').update(email).digest('hex');

    try {
        const {data: {json: {customer_id}}} =
            await axios({
                method: 'post',
                url: 'https://httpbin.org/post',
                data: {customer_id: email_hash},
                timeout: 5000 // 5 sec
            });

        console.log(`for user ${event.user.email} received customer_id: ${customer_id}`);

        api.user.setAppMetadata('customer_id', customer_id);
        api.idToken.setCustomClaim('customer_id', customer_id);

    } catch (err) {
        console.log(`error post login calling CRM for user: ${email}`, err);
        api.access.deny('internal error. try later.');
    }
};
