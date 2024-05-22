/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    const TARGET_AUDIENCE_REGEX = /\/api\/v2\/$/;
    const ALLOWED_SCOPES = ['offline_access', 'read:clients'];

    const limitedClient = () => event?.client?.metadata?.partner === 'true';
    if (!limitedClient()) return;

    const requested_audience = event?.resource_server?.identifier || '';
    if (!requested_audience.match(TARGET_AUDIENCE_REGEX)) return;

    const requested_scopes = event?.transaction?.requested_scopes || [];
    const extra_scopes = requested_scopes.filter(s => !ALLOWED_SCOPES.includes(s));

    if (extra_scopes.length > 0) {
        api.access.deny('unauthorized scopes');
    }

};
