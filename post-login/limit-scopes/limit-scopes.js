exports.onExecutePostLogin = async (event, api) => {

    const TARGET_AUDIENCE_REGEX = /\/api\/v2\/$/;
    const ALLOWED_SCOPES = ['offline_access', 'read:clients'];

    const limitedClient = () => event?.client?.metadata?.partner === 'true';
    if (!limitedClient()) return;

    const requested_audience = event?.resource_server?.identifier || '';
    if (!requested_audience.match(TARGET_AUDIENCE_REGEX)) return;

    const requested_scopes = event?.transaction?.requested_scopes || [];
    const hasExtraScopes = requested_scopes.filter(s => !ALLOWED_SCOPES.includes(s)).length > 0;

    if (hasExtraScopes) {
        api.access.deny('unauthorized scopes');
    }

};
