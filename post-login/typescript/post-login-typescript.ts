import type { Event, PostLoginAPI } from '@auth0/actions/post-login/v3';

declare module '@auth0/actions/post-login/v3' {
    interface Secrets {
        MY_SECRET: string;
    }
}
exports.onExecutePostLogin = async (event: Event, api: PostLoginAPI) => {
    console.log(event);
    api.idToken.setCustomClaim('key', 'value');
    api.idToken.setCustomClaim('secret', event.secrets.MY_SECRET);
}
