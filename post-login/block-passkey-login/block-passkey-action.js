exports.onExecutePostLogin = async (event, api) => {
    console.log(JSON.stringify(event));

    const loggedInWithOnlyPasskey = () => event?.authentication?.methods?.length === 1 && event?.authencation?.methods[0]?.name === 'passkey';
    const appNotSupportsPasskey = () => event?.client?.metadata?.PASSKEY === 'false';

    if (appNotSupportsPasskey() && loggedInWithOnlyPasskey()) {
        api.session.revoke('need to login with password', {'preserveRefreshTokens': true});
        api.access.deny('need to login with password');
    }

};