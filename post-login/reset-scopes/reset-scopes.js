/**
 * This Action removes all requested scopes and sets new scopes using api.accessToken's removeScope() and addScope()
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    api.noop = api.noop || function (x) { }; // this is for unit testing

    const {identifier} = event.resource_server || {};
    const {requested_scopes} = event.transaction || {};

    if (identifier !== 'my.rs') { // not the resource-server I'm interested in
        api.noop('no-my-rs');
        return;
    }

    if (!Array.isArray(requested_scopes)) { // no scopes requested
        api.noop('no-scopes');
        return;
    }

    requested_scopes.forEach(s => api.accessToken.removeScope(s));

    api.accessToken.addScope('s1');

};
