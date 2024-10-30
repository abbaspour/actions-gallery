/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    api.noop = api.noop || function (x) {
    }; // this is for unit testing

    const axios = require('axios');
    const https = require('https');

    const {cert, key, ca} = event.secrets || {};

    console.log(`cert: ${cert}`);
    //console.log(`key : ${key}`);
    console.log(`ca  : ${ca}`);

    try {
        const httpsAgent = new https.Agent({
            cert: cert,
            key: key,
            ca: ca,
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        });

        // Request data parameters
        const data = new URLSearchParams({
            key: 'value'
        });

        const result = await axios.post('https://matls-auth.bank1.directory.sandbox.connectid.com.au/request',
            data, {
                httpsAgent,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
        console.log(result);
    } catch (e) {
        api.access.deny(`api call error: ${e.message}`);
        console.log('Error', e);
    }

    api.noop('success');

};