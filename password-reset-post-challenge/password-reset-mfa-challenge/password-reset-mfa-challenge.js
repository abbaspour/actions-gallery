/**
 * A password-reset / post-challenge Actions can issue an MFA challenge after the user completes the first challenge.
 * For example, you can issue a WebAuthn-based challenge as a secondary factor if your tenant has WebAuthN enabled as a factor.
 * 
 * Handler that will be called during the execution of a Password Reset / Post Challenge Flow.
 *
 * @param {Event} event - Details about the post challenge request.
 * @param {PasswordResetPostChallengeAPI} api - Interface whose methods can be used to change the behavior of the post challenge flow.
 */
exports.onExecutePostChallenge = async (event, api) => {
    const enrolledFactors = event.user.enrolledFactors.map((x) => ({
        type: x.type
    }));
    api.authentication.challengeWith({ type: 'webauthn-roaming' }, { additionalFactors: enrolledFactors });
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect. If your
 * onExecutePostChallenge function does not perform a redirect, this function can be safely ignored.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PasswordResetPostChallengeAPI} api - Interface whose methods can be used to change the behavior of the post challenge flow.
 */
// exports.onContinuePostChallenge = async (event, api) => {
// };
