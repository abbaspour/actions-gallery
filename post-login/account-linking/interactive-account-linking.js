// noinspection DuplicatedCode

/**
 * Author: Amin Abbaspour, Jes Mostek, Carlos Mostek
 * Date: 2024-08-02
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * Generic Action showing how to perform a nested authorization transaction.
 * With nested transactions can build various functionalities on top of Auth0 UL without any server side or companions apps
 * For example you can use this to validated credentials, change password on next login, etc
 *
 * In this example, we are re-authenticating a social account with credential DB and link them.
 *
 * You must configure an "Account Linking Application" for performing the account linking
 *       (https://auth0.com/docs/get-started/auth0-overview/create-applications). Even though this application doesn't exist
 *       outside of the context of Universal Login, it will help keep a separation of concerns. You must grant this separate client
 *       the update:users scope for the management API. This application must be configured as a regular web app so it requires
 *       a client secret
 *
 * NOTE: `domain/continue` should be among allowed callback URLs of this application.
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
 *  - jwks-rsa@latest
 *
 * Secrets:
 *   domain: The canonical domain of the tenant. e.g. mytenantname.us.auth0.com
 *   clientId: The client ID for the Account Linking Application referenced above
 *   clientSecret: The client secret for the Account Linking Application referenced above
 *
 * SAFE HARBOR: This is sample code to demonstrate a concept, it is not battle tested production code that can just be copy and pasted to your
 *              production environment. Before releasing into production you should add the appropriate testing, error handling, and edge
 *              case protections as per your use case.
 *
 */
const interactive_login = new RegExp('^oidc-');
const database_sub = new RegExp('^auth0|');

async function exchangeAndVerify(api, domain, client_id, client_secret, redirect_uri, code, nonce) {

    const axios = require('axios');

    console.log(`exchanging code: ${code}`);

    const {data: {id_token}} =
        await axios({
            method: 'post',
            url: `https://${domain}/oauth/token`,
            data: {
                client_id,
                client_secret,
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

async function linkAndMakePrimary(event, api, primary_sub) {
    //console.log(`linking ${event.user.user_id} under ${primary_sub}`);

    const {ManagementClient, AuthenticationClient} = require('auth0');

    const domain = event?.secrets?.domain;

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

    const client = new ManagementClient({domain, token});

    const {user_id, provider} = event.user.identities[0];

    try {
        await client.users.link({id: primary_sub}, {user_id, provider});
        console.log(`link successful ${primary_sub} to ${user_id} of provider: ${provider}`);
    } catch (err) {
        console.log(`unable to link, no changes. error: ${JSON.stringify(err)}`);
        return;
    }

    api.authentication.setPrimaryUser(primary_sub);

    console.log(`changed primary from ${event.user.user_id} to ${primary_sub}`);
}

/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    console.log(JSON.stringify(event));

    /**
     * This code is for demonstration purposes only. For your actual implementation, you must ensure that you are doing the following:
     *   1) Make sure that you are only calling the management API when absolutely necessary. It would be much better to do a search for
     *      other users with the same email address only once per user and record that information in metadata for both users. Then only force
     *      linking when one of those users signs in.
     *   2) As this action demonstrates, you MUST ensure the user can sign into BOTH accounts before linking the users.
     *   3) You will need to use page templates or custom text to ensure that the user understands that they are signing into the second
     *      account to link accounts. You could also accomplish this through a Form for Action if desired, though that is not demonstrated here.
     *   4) As per the SAFE HARBOR statement at the beginning of this action, you must do additional error handling, edge case handling, and security
     *      review before this action is production ready.
     */

    const protocol = event?.transaction?.protocol || 'unknown';

    if (!interactive_login.test(protocol)) {
        return;
    }

    const strategy = event?.connection?.strategy || 'auth0';

    if (strategy === 'auth0') {
        return;
    }

    if (event.user.identities.length > 1) { // already links
        return;
    }

    console.log(`strategy: ${protocol}`);

    const auth0 = require('auth0-js');

    const domain = event?.secrets?.domain || event.request?.hostname;
    const database = event?.secrets?.database || 'Username-Password-Authentication';

    const authClient = new auth0.Authentication({domain, clientID: event.secrets.clientId});

    const nonce = event.transaction.id;
    console.log(`nonce for inner tx: ${nonce}`);

    const nestedAuthorizeURL = authClient.buildAuthorizeUrl({
        redirectUri: `https://${domain}/continue`,
        nonce,
        responseType: 'code',
        prompt: 'login',
        connection: database,
        login_hint: event.user.email,
        scope: 'openid profile email',
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

    const {code} = event.request.query;

    // Use the Account Linking Application's client ID and secret
    const id_token = await exchangeAndVerify(api, domain, event.secrets.clientId, event.secrets.clientSecret, `https://${domain}/continue`, code, event.transaction.id);

    //console.log(`code: ${code}, id_token: ${JSON.stringify(id_token)}`);

    if (id_token.email_verified !== true) {
        console.log(`skipped linking, email not verified in nested tx user: ${id_token.email}`);
        return;
    }

    if (!database_sub.test(id_token.sub)) {
        api.access.deny(`invalid sub from inner tx: ${id_token.sub}`);
        return;
    }

    /* If you are only linking users with the same email, you can uncomment this
    if (event.user.email !== id_token.email) {
        api.access.deny('emails do not match');
        return;
    }
    */

    await linkAndMakePrimary(event, api, id_token.sub);
};
