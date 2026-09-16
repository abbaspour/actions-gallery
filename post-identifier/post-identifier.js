/**
 * Handler that will be called during the execution of a Login / Post Identifier Flow.
 *
 * @param {Event} event - Details about the post identifier request.
 * @param {LoginPostIdentifierAPI} api - Interface whose methods can be used to change the behavior of the login post identifier flow.
 */
exports.onExecutePostIdentifier = async (event, api) => {
    console.log(`onExecutePostIdentifier event: ${JSON.stringify(event)}`);

    api.authentication.setConnectionByName('Users');
    api.authentication.setConnectionByName('Username-Password-Authentication');
};
