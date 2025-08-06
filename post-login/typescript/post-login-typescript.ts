import type { Event, PostLoginAPI } from '@auth0/actions/post-login/v3';

exports.onExecutePostLogin = async (event: Event, api: PostLoginAPI) => {
    console.log(event);
    api.idToken.setCustomClaim('key', 'value');
}
