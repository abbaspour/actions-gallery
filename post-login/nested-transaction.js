const jwt = require('jsonwebtoken');
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
 */
const interactive_login = new RegExp('^oidc-');

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

    const domain = event?.secrets?.clientId || 'actions-gallery.au.auth0.com';

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


exports.onContinuePostLogin = async (event, api) => {
    console.log(`onContinuePostLogin event: ${JSON.stringify(event)}`);

    const domain = event?.secrets?.clientId || 'actions-gallery.au.auth0.com';

    const {state, code} = event.request.query;

    const id_token = await exchange(domain, event.client.client_id, `https://${domain}/continue`, code);

    console.log(`state: ${state}, code: ${code}, id_token: ${id_token}, email: ${id_token.email}, sub: ${id_token.sub}`);
};
