/**
 * Checks request custom domain and decides whether this organization accepts this domain or not
 *
 * Organization is supposed to have a comma seperated list of domains either
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {

    console.log(`org ${event?.organization?.name} accessed from domain ${event?.request?.hostname}`);

    if (event?.organization?.metadata?.deny_domains && event?.organization?.metadata?.allow_domains) {
        console.warn(`[WARNING] configuration issue. org ${event?.organization?.name} has both deny_domains and allow_domains`);
    }

    // Check either deny (A) allow (B) not both

    // (A) checks org's deny_list
    const isDomainDenied = () =>
        (event?.organization?.metadata?.deny_domains ? event?.organization?.metadata?.deny_domains.split(',').map(d => d.trim()).includes(event?.request?.hostname) : false);

    if (isDomainDenied()) {
        return api.access.deny(`access to org ${event?.organization?.name} not allowed on domain ${event?.request?.hostname}`);
    }

    // (B) checks org's allow_list
    const isDomainAllowed = () =>
        (event?.organization?.metadata?.allow_domains ? event?.organization?.metadata?.allow_domains.split(',').map(d => d.trim()).includes(event?.request?.hostname) : false);

    if (!isDomainAllowed()) {
        return api.access.deny(`access to org ${event?.organization?.name} not allowed on domain ${event?.request?.hostname}`);
    }

};