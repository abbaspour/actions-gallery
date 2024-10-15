// noinspection DuplicatedCode

/**
 * Author: Amin Abbaspour
 * Date: 2024-10-15
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * Generic Action showing how to perform caching access_token
 *
 * NPM Dependencies:
 *  - auth0@4.10.0
 *
 * Secrets:
 *   domain: The canonical domain of the tenant. e.g. mytenantname.us.auth0.com
 *   clientId: The client ID for APIv2 client
 *   clientSecret: The client secret for APIv2 client
 *
 * SAFE HARBOR:
 * This is sample code to demonstrate a concept, it is not battle tested production code that can just be copy and pasted to your
 * production environment. Before releasing into production you should add the appropriate testing, error handling, and edge
 * case protections as per your use case.
 */

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
    try {
        const client = await getCachedManagementClient(event, api);
        const {data} = await client.users.get({id: event.user.user_id});
        console.log(`current user profile: ${JSON.stringify(data)}`);
    } catch (e) {
        const message = e && e.message ? e.message : 'unknown error';
        api.access.deny(message);
    }
};

async function getCachedManagementClient(event, api) {
    const {ManagementClient, AuthenticationClient} = require('auth0');

    const domain = event?.secrets?.domain || event.request?.hostname; // we need domain for happy path. see return

    let {value: token} = api.cache.get('management-token') || {};

    if (!token) {
        console.log('cache MIS m2m token');

        const {clientId, clientSecret} = event.secrets || {};
        if (!clientId || !clientSecret) throw new Error('missing clientId or clientSecret in secrets');


        const cc = new AuthenticationClient({domain, clientId, clientSecret});
        const {data} = await cc.oauth.clientCredentialsGrant({audience: `https://${domain}/api/v2/`});
        token = data?.access_token;

        if (!token) throw new Error('failed get api v2 cc token');
        const result = api.cache.set('management-token', token, {ttl: data.expires_in * 1000});
        if (result?.type === 'error') console.log(`WARNING: failed to set the token in the cache with error code: ${result.code}`);
    } else {
        console.log('cache HIT m2m token');
    }

    return new ManagementClient({domain, token});
}
