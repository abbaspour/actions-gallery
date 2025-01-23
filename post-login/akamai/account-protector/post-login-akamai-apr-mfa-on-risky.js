/**
 * sample Auth0 post-login action to detect risky login from Akamai API and Account Protector Akamai-User-Risk header
 *
 * Author: Amin Abbaspour
 * Date: 2025-01-24
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * @param event
 * @param api
 * @returns {Promise<void>}
 */
exports.onExecutePostLogin = async (event, api) => {
    //console.log(`request event: ${JSON.stringify(event.request)}`);
    //api.idToken.setCustomClaim('host-header', event.request?.headers?.host || 'unknown');
    const userRiskHeader = event.request?.headers?.['akamai-user-risk'];
    console.log(`akamai-user-risk header: ${userRiskHeader}`);

    if (!userRiskHeader) {
        console.log('akamai-user-risk header not found');
        return;
    }

    const parsedHeader = parseAkamaiUserRisk(userRiskHeader);
    if (parsedHeader?.risk?.vpn === 'true/H' || parsedHeader?.score >= 30) {
        console.log('User is using a VPN');
        api.authentication.challengeWith({type: 'email'});
    }
};

// Function to parse Akamai-User-Risk header string
function parseAkamaiUserRisk(headerString) {
    const parsedResult = {};

    // Split the string by semicolons to get key-value pairs
    const pairs = headerString.split(';');

    pairs.forEach(pair => {
        // Split each pair by the first equals sign
        const [key, value] = pair.split(/=(.+)/);
        if (key && value !== undefined) {
            if (key === 'general' || key === 'risk') {
                // For nested key-value strings, further parsing is needed
                parsedResult[key.trim()] = parseNestedString(value);
            } else {
                parsedResult[key.trim()] = value.trim();
            }
        } else if (key && value === undefined) {
            // Handle keys with empty values
            parsedResult[key.trim()] = null;
        }
    });

    return parsedResult;
}

// Helper function to parse nested key-value strings
function parseNestedString(nestedString) {
    const nestedResult = {};

    // Split by pipe or slash delimiters for nested key-value pairs
    const entries = nestedString.split('|');
    entries.forEach(entry => {
        const [nestedKey, nestedValue] = entry.split(/:(.+)/);
        if (nestedKey && nestedValue !== undefined) {
            nestedResult[nestedKey.trim()] = nestedValue.trim();
        }
    });

    return nestedResult;
}

