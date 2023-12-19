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
 * NOTE: if using NUL, authentication profile should be "Identifier First"
 *
 * @param event https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object
 * @param api https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object
 * @returns {Promise<void>}
 *
 * NPM Dependencies:
 *  - auth0-js@9.23.3
 *  - axios@1.6.2
 *  - jsonwebtoken@9.0.2
 *  - auth0@4.1.0
 */
const interactive_login = new RegExp('^oidc-');
const database_sub = new RegExp('^auth0|');

async function exchangeAndVerify(api, domain, client_id, redirect_uri, code, nonce) {

    const axios = require('axios');

    //console.log(`exchanging code: ${code}`);

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

    //console.log(`id_token: ${id_token}`);

    const jwt = require('jsonwebtoken');

    const jwksClient = require('jwks-rsa');

    const client = jwksClient({
        jwksUri: `https://${domain}/.well-known/jwks.json`
    });

    function getKey(header, callback) {

        const {value: signingKey} = api.cache.get(`key-${header.kid}`) || {};

        if (!signingKey) {
            console.log(`cache MIS signing key: ${header.kid}`);

            client.getSigningKey(header.kid, (err, key) => {
                if (err) {
                    console.log('failed to download signing key: ', err.message);
                    return callback(err);
                }

                const signingKey = key.publicKey || key.rsaPublicKey;

                const result = api.cache.set(`key-${header.kid}`, signingKey);

                if (result?.type === 'error') {
                    console.log('failed to set signing key in the cache', result.code);
                }

                callback(null, signingKey);
            });
        } else {
            callback(null, signingKey);
        }
    }

    return new Promise((resolve, reject) => {
        jwt.verify(id_token, getKey, {
            issuer: `https://${domain}/`,
            audience: client_id,
            nonce,
            algorithms: 'RS256'
        }, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
        });
    });
}

async function markEmailVerified(event, api) {
    //console.log(`linking ${event.user.user_id} under ${primary_sub}`);

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

    const client = new ManagementClient({domain, token});

    try {
        await client.users.update({id: event.user.user_id}, {email_verified: true});
        console.log(`successful update email_verified to true for user: ${event.user.email}`);
    } catch (err) {
        console.log(`unable to update email_verified, no changes. error: ${JSON.stringify(err)}`);
    }

    api.idToken.setCustomClaim('email_verified', true);

}

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    //console.log(JSON.stringify(event));

    if (event.user.email_verified === true) {
        return;
    }

    const protocol = event?.transaction?.protocol || 'unknown';

    if (!interactive_login.test(protocol)) {
        return;
    }

    const strategy = event?.connection?.strategy || 'auth0';

    if (strategy !== 'auth0') {
        return;
    }

    console.log(`strategy: ${protocol}`);

    const auth0 = require('auth0-js');

    const domain = event?.secrets?.domain || event.request?.hostname;

    const authClient = new auth0.Authentication({domain, clientID: event.client.client_id});

    const nonce = event.transaction.id;
    console.log(`nonce for inner tx: ${nonce}`);

    const nestedAuthorizeURL = authClient.buildAuthorizeUrl({
        redirectUri: `https://${domain}/continue`,
        nonce,
        responseType: 'code',
        prompt: 'login',
        connection: 'email',
        login_hint: event.user.email,
        scope: 'openid profile email',
        //responseMode: 'form_post' // Auth0 wants `state` in query parameter, hence we can't do form_post :(
        // TODO: PKCE
        // NOTE: authentication profile should be "Identifier First"
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
    //console.log(`onContinuePostLogin event: ${JSON.stringify(event)}`);

    const domain = event?.secrets?.domain || event.request?.hostname;

    const {code} = event.request.query;

    const id_token = await exchangeAndVerify(api, domain, event.client.client_id, `https://${domain}/continue`, code, event.transaction.id);

    //console.log(`code: ${code}, id_token: ${JSON.stringify(id_token)}`);

    if (id_token.email_verified !== true) {
        console.log(`skipped updating, email not verified in nested tx user: ${id_token.email}`);
        return;
    }

    if (!database_sub.test(id_token.sub)) {
        api.access.deny(`invalid sub from inner tx: ${id_token.sub}`);
        return;
    }

    /*
    if (event.user.email !== id_token.email) {
        api.access.deny('emails do not match');
        return;
    }
    */

    await markEmailVerified(event, api);
};
