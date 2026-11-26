/**
 * Agents may not request offline_access. This Action adds offline_access to sign-ins from agents to Poppy APIs,
 * so that a refresh token is issued. Must be bound last in the post-login flow.
 *
 * https://auth0.com/docs/ai-agents-mcp/personal-agents/set-up-with-auth0-cli
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    api.noop = api.noop || function (x) { }; // this is for unit testing

    const POPPY_APIS = ['https://shop.abbaspour.net']; // Your Poppy API identifiers

    // An agent is acting when the client is linked to an agent record.
    if (!event.agent || !event.agent.agent_id) {
        api.noop('no-agent');
        return;
    }

    // Only a sign-in to a Poppy API needs a refresh token.
    if (!POPPY_APIS.includes(event.resource_server?.identifier)) {
        api.noop('not-poppy-api');
        return;
    }

    const targetScopes = event.transaction?.target_scopes ?? [];
    if (targetScopes.includes('offline_access')) {
        api.noop('has-offline-access');
        return;
    }

    api.transaction.addTargetScope('offline_access');
};
