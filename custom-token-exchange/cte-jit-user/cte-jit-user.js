/**
 *
 * @param {import('@auth0/actions/custom-token-exchange/v1').Event} event
 * @param {import('@auth0/actions/custom-token-exchange/v1').CustomTokenExchangeAPI} api
 * @returns {Promise<void>}
 */
exports.onExecuteCustomTokenExchange = async (event, api) => {

    console.log('onExecuteCustomTokenExchange', event);

    const jose = require('jose');

    // 1. Validate subject_token
    const profile = jose.decodeJwt(event.transaction.subject_token);

    // 2. Set the user for the transaction
    api.authentication.setUserByConnection(
        'Username-Password-Authentication',
        {
            user_id: profile.sub,
            email: profile.email,
            email_verified: profile.email_verified,
            phone_number: profile.phone_number,
            phone_verified: profile.phone_number_verified,
            username: profile.preferred_username,
            name: profile.name,
            given_name: profile.given_name,
            family_name: profile.family_name,
            nickname: profile.nickname,
            verify_email: false
        },
        {
            creationBehavior: 'create_if_not_exists',
            updateBehavior: 'replace'
        }
    );

};