/**
 * There is no easy way to block sign-ups from social logins.
 * This action detects if login is the first time, delete the user and removes the session
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 *
 * NPM Dependencies:
 *  - auth0@4.10.0
 *
 * Secrets:
 *   domain: The canonical domain of the tenant. e.g. mytenantname.us.auth0.com
 *   clientId: The client ID for APIv2 client
 *   clientSecret: The client secret for APIv2 client
 */

exports.onExecutePostLogin = async (event, api) => {

    console.log(`event: ${JSON.stringify(event)}`);

    api.noop = api.noop || function (x) {
    };

    const strategy = event?.connection?.strategy || 'unknown';

    if (strategy === 'auth0') {
        api.noop('not from social');
        return;
    }

    const logins_count = event?.stats?.logins_count || 0;

    if (logins_count > 1) {
        api.noop('not first time login');
        return;
    }

    const client = await getCachedManagementClient(event, api);
    await client.users.delete({id: event.user.user_id});

    console.log(`deleted user: ${event.user.user_id}`);

    api.session.revoke('signup unsupported');
    api.access.deny('signup unsupported');

};

// noinspection DuplicatedCode
async function getCachedManagementClient(event, api) {
    const {ManagementClient, AuthenticationClient} = require('auth0');

    const domain = event?.secrets?.domain || event.request?.hostname; // we need domain for happy path. see return

    let {value: token} = api.cache.get('delete-management-token') || {};

    if (!token) {
        console.log('cache MIS m2m token');

        const {clientId, clientSecret} = event.secrets || {};
        if (!clientId || !clientSecret) throw new Error('missing clientId or clientSecret in secrets');


        const cc = new AuthenticationClient({domain, clientId, clientSecret});
        const {data} = await cc.oauth.clientCredentialsGrant({audience: `https://${domain}/api/v2/`});
        token = data?.access_token;

        if (!token) throw new Error('failed get api v2 cc token');
        const result = api.cache.set('delete-management-token', token, {ttl: data.expires_in * 1000});
        if (result?.type === 'error') console.log(`WARNING: failed to set the token in the cache with error code: ${result.code}`);
    } else {
        console.log('cache HIT m2m token');
    }

    return new ManagementClient({domain, token});
}
