// noinspection DuplicatedCode

/**
 * Author: Amin Abbaspour
 * Date: 2024-05-22
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * Fetch Google Group Ids to attach to id_token or do security checks against a predefined list
 *
 *
 * @param event https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object
 * @param api https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object
 * @returns {Promise<void>}
 *
 * NPM Dependencies:
 *  - gapps-directory
 *  - auth0
 *
 * Secrets
 * - domain your canonical auth0 domain name
 * - clientId, clientSecret with read:connections scope
 */
exports.onExecutePostLogin = async (event, api) => {

    const interactive_login = new RegExp('^oidc-');

    const protocol = event?.transaction?.protocol || 'unknown';

    if (!interactive_login.test(protocol)) {
        return;
    }

    const strategy = event?.connection?.strategy || 'unknown';

    if (strategy !== 'google-apps') {
        return;
    }

    const usersClient = await getUsersClient(event, api);

    console.log(`reading groups for user: ${event.user.email}`);

    usersClient.getAllUserGroups(event.user.email, (err, groups) => {
        if (err) {
            api.access.deny(`Unable to get groups: ${err.message}`);
            return;
        }

        console.log(`user groups: ${JSON.stringify(groups)}`);
    });
};

async function getUsersClient(event, api) {

    let {value: domain} = api.cache.get('gapps_domain') || {};
    let {value: client_id} = api.cache.get('gapps_client_id') || {};
    let {value: client_secret} = api.cache.get('gapps_client_secret') || {};
    let {value: refresh_token} = api.cache.get('gapps_refresh_token') || {};

    if (!refresh_token || !client_id || !client_secret || !domain) {
        const connection_id = event?.connection?.id;

        console.log(`fetching gapps secrets from connection: ${connection_id}`);

        const client = await getManagementClient(event, api);

        const { data: detail } = await client.connections.get({id: connection_id});

        const options = detail?.options || {};

        domain = options.domain;
        client_id = options.client_id;
        client_secret = options.client_secret;
        refresh_token = options.admin_refresh_token;

        api.cache.set('gapps_domain', domain);
        api.cache.set('gapps_client_id', client_id);
        api.cache.set('gapps_client_secret', client_secret);
        api.cache.set('gapps_refresh_token', refresh_token);
    }

    console.log(`apps details: domain: ${domain}, client_id: ${client_id}`);

    const UsersClient = require('gapps-directory').Users;
    return new UsersClient({domain, client_id, client_secret, refresh_token});
}

async function getManagementClient(event, api) {

    const {ManagementClient, AuthenticationClient} = require('auth0');

    const domain = event?.secrets?.domain || event.request?.hostname;

    let {value: token} = api.cache.get('management-token') || {};

    if (!token) {
        const {clientId, clientSecret} = event.secrets || {};

        const cc = new AuthenticationClient({domain, clientId, clientSecret});

        try {
            const {data} = await cc.oauth.clientCredentialsGrant({audience: `https://${domain}/api/v2/`});

            token = data?.access_token;

            if (!token) {
                console.log('failed get api v2 cc token');
                return;
            }
            console.log('cache MIS m2m token!');

            const result = api.cache.set('management-token', token, {ttl: data.expires_in * 1000});

            if (result?.type === 'error') {
                console.log('failed to set the token in the cache with error code', result.code);
            }
        } catch (err) {
            console.log('failed calling cc grant', err);
            return;
        }
    }

    //console.log(`m2m token: ${token}`);

    return new ManagementClient({domain, token});
}