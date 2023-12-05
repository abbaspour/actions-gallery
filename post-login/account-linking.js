/**
 * Link and merge customer_id
 *
 * Author: Amin Abbaspour
 * Date: 2023-11-22
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param event https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object
 * @param api https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object
 * @returns {Promise<void>}
 *
 * NPM Dependencies:
 *  - auth0
 */
exports.onExecutePostLogin = async (event, api) => {

    console.log('account-link action user: ', event?.user?.email);

    const {ManagementClient, AuthenticationClient} = require('auth0');

    api.nope = api.nope || function() {};

    if (event?.user?.email_verified !== true) { // no linking if email is not verified
        api.nope('email not verified');
        return;
    }

    /*
      if (event.user.identities.length > 1) { // no linking if user is already linked
          return;
      }
      */

    const {domain} = event.secrets || {};

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

    const client = new ManagementClient({domain, token});

    // Search for other candidate users
    const {data: candidateUsers} = await client.usersByEmail.getByEmail({email: event?.user?.email});

    if (!Array.isArray(candidateUsers) || !candidateUsers.length) { // didn't find anything
        return;
    }

    const firstCandidate = candidateUsers.find((c) =>
        c.user_id !== event.user.user_id &&         // not the current user
        //c.identities[0].provider === "auth0" &&   // DB user
        c.email_verified                            // make sure email is verified
    );

    if (!firstCandidate) { // didn't find any other user with the same email other than ourselves
        return;
    }

    const primaryChanged = firstCandidate.provider === 'auth0';

    let primaryUserId, secondaryProvider, secondaryUserId, primaryCustomerId, secondaryCustomerId;

    if (primaryChanged) {
        primaryUserId = firstCandidate.user_id;
        secondaryProvider = event.user.identities[0].provider;
        secondaryUserId = event.user.identities[0].user_id;

        primaryCustomerId = firstCandidate.app_metadata.customer_id;
        secondaryCustomerId = event.user.app_metadata.customer_id;
    } else {
        primaryUserId = event.user.user_id;
        secondaryProvider = firstCandidate.identities[0].provider;
        secondaryUserId = firstCandidate.user_id;

        primaryCustomerId = event.user.app_metadata?.customer_id;
        secondaryCustomerId = firstCandidate.app_metadata?.customer_id;
    }

    try {
        await client.users.link({id: primaryUserId}, {provider: secondaryProvider, user_id: secondaryUserId});
    } catch (err) {
        console.log('unable to link, no changes');
        return;
    }

    // -- customer_id(s) logic --
    if (secondaryCustomerId) {   // we have a secondary customer id, time to do some merge
        if (primaryCustomerId) { // both customer_ids remain and merge
            api.user.setAppMetadata('customer_id', [primaryCustomerId, secondaryCustomerId]);
        } else {
            api.user.setAppMetadata('customer_id', secondaryCustomerId);
        }
    }

    if (primaryChanged) api.authentication.setPrimaryUser(primaryUserId);

};
