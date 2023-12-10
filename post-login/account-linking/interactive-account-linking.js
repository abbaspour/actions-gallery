// noinspection DuplicatedCode

/**
 * Author: Amin Abbaspour
 * Date: 2023-11-22
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * Generic Action showing how to perform a nested authorisation transaction.
 * With nested transactions can build various functionalities on top of Auth0 UL without any server side or companions apps
 * For example you can use this to validated credentials, change password on next login, etc
 *
 * In this example, we are re-authenticating a social account with credential DB and link them.
 *
 * NOTE: `domain/continue` should be among allowed callback URLs of your client.
 *
 * @param event https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object
 * @param api https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object
 * @returns {Promise<void>}
 *
 * NPM Dependencies:
 *  - auth0-js@9.23.3
 *  - uuid@9.0.1
 *  - axios@1.6.2
 *  - jsonwebtoken@9.0.2
 *  - auth0@4.1.0
 */
const interactive_login = new RegExp('^oidc-');
const database_sub = new RegExp('^auth0|');

async function exchange(domain, client_id, redirect_uri, code) {

    const axios = require('axios');

    console.log(`exchanging code: ${code}`);

    const {data: {id_token}} =
        await axios({
            method: 'post',
            url: `https://${domain}/oauth/token`,
            data: {
                client_id,
                code,
                grant_type: 'authorization_code',
                redirect_uri
            },
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 sec
        });

    console.log(`id_token: ${id_token}`);

    const jwt = require('jsonwebtoken');

    const jwksClient = require('jwks-rsa');

    const client = jwksClient({
        jwksUri: `https://${domain}/.well-known/jwks.json`
    });

    function getKey(header, callback) {
        // TODO: cache
        client.getSigningKey(header.kid, function (err, key) {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    }

    return new Promise((resolve, reject) => {
        jwt.verify(id_token, getKey, {
            issuer: `https://${domain}/`,
            audience: client_id,
            algorithms: 'RS256'
        }, function (err, decoded) {
            if (err) reject(err);
            resolve(decoded);
        });
    });
}

async function linkAndMakePrimary(event, api, primary_sub) {
    console.log(`linking ${event.user.user_id} under ${primary_sub}`);

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
            console.log('cache MIS!');

            const result = api.cache.set('management-token', token, {ttl: data.expires_in * 1000});

            if (result?.type === 'error') {
                console.log('failed to set the token in the cache with error code', result.code);
            }
        } catch (err) {
            console.log('failed calling cc grant', err);
            return;
        }
    }

    console.log(`m2m token: ${token}`);

    const client = new ManagementClient({domain, token});

    const {user_id, provider} = event.user.identities[0];

    try {
        await client.users.link({id: primary_sub}, {user_id, provider});
    } catch (err) {
        console.log(`unable to link, no changes. error: ${JSON.stringify(err)}`);
        return;
    }

    api.authentication.setPrimaryUser(primary_sub);

}

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    api.nope = api.nope || function () {
    };

    console.log(JSON.stringify(event));

    const protocol = event?.transaction?.protocol || 'unknown';

    if (!interactive_login.test(protocol)) {
        api.nope('non-interactive-login');
        return;
    }

    const strategy = event?.connection?.strategy || 'auth0';

    if (strategy === 'auth0') {
        api.nope('auth0-strategy');
        return;
    }

    if (event.user.identities.length > 1) { // already links
        api.nope('already-linked');
        return;
    }

    console.log(`strategy: ${protocol}`);

    const auth0 = require('auth0-js');

    const domain = event?.secrets?.domain || event.request?.hostname;

    const authClient = new auth0.Authentication({domain, clientID: event.client.client_id});

    const {v4: uuid} = require('uuid');

    const nonce = uuid();

    const nestedAuthorizeURL = authClient.buildAuthorizeUrl({
        redirectUri: `https://${domain}/continue`,
        nonce,
        responseType: 'code',
        prompt: 'login',
        connection: 'Users',
        login_hint: event.user.email,
        scope: 'openid profile email',
        //responseMode: 'form_post' // Auth0 wants `state` in query parameter, hence we can't do form_post :(
        // TODO: PKCE
    });

    console.log(`redirecting to ${nestedAuthorizeURL}`);

    api.redirect.sendUserTo(nestedAuthorizeURL);

};

/**
 * Handler that will be invoked when this action is resuming after an external redirect. If your
 * onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onContinuePostLogin = async (event, api) => {
    console.log(`onContinuePostLogin event: ${JSON.stringify(event)}`);

    const domain = event?.secrets?.domain || event.request?.hostname;

    const {state, code} = event.request.query;

    const id_token = await exchange(domain, event.client.client_id, `https://${domain}/continue`, code);

    console.log(`state: ${state}, code: ${code}, id_token: ${JSON.stringify(id_token)}`);

    api.nope = api.nope || function () {
    };

    if (!id_token.email_verified) {
        api.nope('email not verified');
        return;
    }

    if (!database_sub.test(id_token.sub)) {
        api.access.deny(`invalid sub from inner tx: ${id_token.sub}`);
        return;
    }

    await linkAndMakePrimary(event, api, id_token.sub);
};
