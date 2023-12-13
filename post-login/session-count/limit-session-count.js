'use strict';

const interactive_login = new RegExp('^oidc-');

/**
 * Count and limit Session Count
 *
 * Author: Amin Abbaspour
 * Date: 2023-11-22
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param event https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/event-object
 * @param api https://auth0.com/docs/customize/actions/flows-and-triggers/login-flow/api-object
 * @returns {Promise<void>}
 *
 * TODO: can we count on first interactive login only?
 * TODO: api.cache to cache est session count
 *
 * NPM Dependencies:
 *  - redisio
 */
exports.onExecutePostLogin = async (event, api) => {

    const protocol = event?.transaction?.protocol || 'unknown';

    if (!interactive_login.test(protocol)) {
        return;
    }

    const Redis = require('ioredis');

    const {REDIS_URL, REDIS_PASSWORD, SESSION_LIFETIME, MAX_SESSION} = event.secrets || {};

    const redis = new Redis(`redis://:${REDIS_PASSWORD}@${REDIS_URL}`, {
        autoResubscribe: false,
        maxRetriesPerRequest: 5,
    });

    async function addSession(sub, sid) {
        await redis.set(`${sub}:${sid}`, '1', 'EX', SESSION_LIFETIME);
    }

    async function countSession(sub) {
        const found = [];
        let cursor = '0';

        do {
            const reply = await redis.scan(cursor, 'MATCH', `${sub}:*`, 'COUNT', 10);
            cursor = reply[0];
            found.push(...reply[1]);
        } while (cursor !== '0');

        return found.length;
    }

    const sub = event.user.user_id;
    const sid = event.session.id;

    await addSession(sub, sid);

    const count = await countSession(sub);

    console.log(`session count for user ${sub}: ${count}`);

    if (count >= MAX_SESSION) {
        api.access.deny('max sessions reached');
    }

};

