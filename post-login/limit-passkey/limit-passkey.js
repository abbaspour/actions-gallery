exports.onExecutePostLogin = async (event, api) => {
    const loggedInWithOnlyPasskey = () => event?.authentication?.methods?.length === 1 && event?.authencation?.methods[0]?.name === 'passkey';
    const appNotSupportsPasskey = () => event?.client?.metadata?.PASSKEY === 'false';

    if (appNotSupportsPasskey() && loggedInWithOnlyPasskey()) {
        api.session.revoke('passkey unsupported', {'preserveRefreshTokens': true});
        api.access.deny('passkey unsupported');
    }

};