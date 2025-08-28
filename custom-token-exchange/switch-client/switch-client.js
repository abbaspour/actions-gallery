
// noinspection DuplicatedCode

/**
 * Exchange from token issues to client (A) to tokens(s) to client (B) while maintaining same user (subject)
 *
 * @param {Event} event - Details about the incoming token exchange request.
 * @param {CustomTokenExchangeBetaAPI} api - Methods and utilities to define token exchange process.
 *
 * NPM Dependencies:
 *  - jose@^6.0.11
 */
exports.onExecuteCustomTokenExchange = async (event, api) => {
    console.log('Event', event);

    const domain = event?.secrets?.domain || event.request?.hostname;

    const {subject_token_type, subject_token} = event.transaction || {};

    if (subject_token_type !== 'urn:ietf:params:oauth:token-type:access_token') {
        return api.access.deny('invalid_request', 'unsupported subject-token-type');
    }

    const access_token = await validateAccessToken(domain, api, subject_token);

    api.authentication.setUserById(access_token.sub);
};

async function validateAccessToken(domain, api, access_token) {

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
        jwt.verify(access_token, getKey, {
            issuer: `https://${domain}/`,
            //audience: client_id,
            algorithms: 'RS256'
        }, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
        });
    });
}
