/**
 * Revoke User refresh tokens post change password.
 *
 * Author: Vikas Jayaram <vikas@okta.com>
 * Date: 2023-12-19
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param {Event} event - Details about user whose password was changed.
 */
const async = require('async');
const _ = require('lodash');
const tools = require('auth0-extension-tools');

exports.onExecutePostChangePassword = async (event) => {
    const user_id = event.user.user_id;

    function callAuth0ManagementApi(stage, options, callback) {
        // TODO: cache
        tools.managementApi.getClient({
            domain: event.secrets.AUTH0_DOMAIN,
            clientId: event.secrets.AUTH0_CLIENT_ID,
            clientSecret: event.secrets.AUTH0_CLIENT_SECRET
        })
            .then(function (client) {
                switch (stage) {
                    case 'get_device_credentials':
                        client.deviceCredentials.getAll({user_id: user_id}, function (error, dCredentials) {
                            if (error) return callback(error);
                            options.deviceCredentials = dCredentials;
                            return callback(null, options);
                        });
                        break;
                    case 'revoke_refresh_tokens':
                        _.each(options.deviceCredentials, function (dCredential) {
                            client.deviceCredentials.delete({id: dCredential.id}, function (error) {
                                if (error) throw new Error(error);
                            });
                        });
                        return callback(null, 'done');
                }
            })
            .catch(error => console.log(error));
    }

    function getDeviceCredentials(options, callback) {
        callAuth0ManagementApi('get_device_credentials', options, callback);
    }

    function revokeRefreshTokens(options, callback) {
        callAuth0ManagementApi('revoke_refresh_tokens', options, callback);
    }

    async.waterfall([
        async.apply(getDeviceCredentials, {}),
        revokeRefreshTokens,
    ], function (err, result) {
        if (err) {
            console.log('err', err);
        } else {
            console.log('result: ', result);
        }
    });
};