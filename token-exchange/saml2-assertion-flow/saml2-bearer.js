/**
 * Validates and Exchanges a SAML response to an OAuth2.0 access_token
 *
 * @param {Event} event - Details about the incoming token exchange request.
 * @param {CustomTokenExchangeBetaAPI} api - Methods and utilities to define token exchange process.
 */
const xml2js = require('xml2js');
const {SignedXml} = require('xml-crypto');

// SAML issuer (e.g. this tenant's) certificate. Injected by CI/CD
// sourced from https://tenant.domain/.well-known/jwks.json
const certificate = `-----BEGIN CERTIFICATE-----
MIIC+zCCAeOgAwIBAgIJJnB5qiIE+78kMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNV
BAMTEGFtaW4wMi5hdXRoMC5jb20wHhcNMTcxMDE5MjMwOTM4WhcNMzEwNjI4MjMw
OTM4WjAbMRkwFwYDVQQDExBhbWluMDIuYXV0aDAuY29tMIIBIjANBgkqhkiG9w0B
AQEFAAOCAQ8AMIIBCgKCAQEAtl1VjF/mBABI/wTXSUfpI8BZzOgt7t5z4e85dX6z
bcBdrH4QSZocKuEz4SWNJLV5b7xCieN4w57uwURph6SD5ySfro+YzQn3w+kgOme8
yfsF2Ysphr+AJ7Ot7oZhwqs2h0yNKVwNmQ8gEfCMepImDh+/CcJXvl2+ANpaZEou
VX3cl7+ao1uPY9gfwnz7tTuP6Hx8L0aond2kEFxI4z4e/wy93Cf9AmYPrRkJHqCO
Fid9IboXvvuyYUxhf/fzkPRvwoMvUU97UumB2Nc1fxsqgTdPwYh6wL/s2dJ1sdG+
+xX8DBRHC3jyqgOoBdzRceK+5v6jcMUezCkstPtqxucB1QIDAQABo0IwQDAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBRj2S8Ous5pS1GF2B/ziRBklQJu6zAOBgNV
HQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBABwtJWQPnDxUX9sfzYQcOS+m
Xwl/dRpUuBo6yfqrDXrJ+ZpSnSG7YvUf/yJMSMZyAYIFQrlKtTcfMLz6Zzvlhz5N
8DwQCejFJ0XYUjfKlJA5DLir2zRuAJxrhRjvi+lawv5FuVt99+NQi6X2ytXTbFF9
AUrGJDHBPuVdIuNrlhokra4BV30R1Rw2oUWOs/jVreYL4Dbyc+dZudIssDrsQVM5
+UbJ3pCfh4lPbw3ylMZvVTHquQCJ+KOPMkB2HvzrvTK8rCWpUHW/3rp9vbdkl40z
ppbSot1YG+y0DUAmyKwNyvp16uT27D8iYbAVTvfTZz0aBd0cLjwfjCoabB3te24=
-----END CERTIFICATE-----
`;


exports.onExecuteCustomTokenExchange = async (event, api) => {
    console.log('Event', event);

    const {subject_token_type, subject_token} = event.transaction || {};

    if (subject_token_type !== 'urn://saml') {
        api.access.deny('invalid_request', 'unsupported subject-token-type');
        return;
    }

    const extractedAssertions = await processSamlAssertion(subject_token);

    if (extractedAssertions === null) {
        api.access.deny('invalid_request', 'saml assertion not valid');
        return;
    }

    api.authentication.setUserById(extractedAssertions.NameID);
};


// Function to decode base64 SAML assertion
function decodeSamlAssertion(base64Assertion) {
    return Buffer.from(base64Assertion, 'base64').toString('utf-8');
}

// Function to parse SAML assertion XML
async function parseSamlAssertion(xmlAssertion) {
    const parser = new xml2js.Parser({explicitArray: false});
    return parser.parseStringPromise(xmlAssertion);
}

// Function to extract assertions (NameID, name, and email)
function extractAssertions(parsedSamlResponse) {
    const assertion = parsedSamlResponse['samlp:Response']['saml:Assertion'];

    // Extract NameID
    const nameID = assertion['saml:Subject']['saml:NameID']._;

    // Extract attributes like name and email
    const attributes = assertion['saml:AttributeStatement']['saml:Attribute'];
    const extracted = {
        NameID: nameID,
        Name: null,
        Email: null,
    };

    attributes.forEach(attr => {
        if (attr.$.Name === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name') {
            extracted.Name = attr['saml:AttributeValue']._;
        }
        if (attr.$.Name === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') {
            extracted.Email = attr['saml:AttributeValue']._;
        }
    });

    return extracted;
}

// Function to validate SAML signature using an external certificate file
function validateSamlSignature(xml) {

    const doc = new SignedXml({publicCert: certificate});

    // Load the entire XML to find and validate the signature
    const signature = xml.match(/<Signature[^>]*>([\s\S]*?)<\/Signature>/);
    if (signature) {
        doc.loadSignature(signature[0]);

        const isValid = doc.checkSignature(xml);
        if (!isValid) {
            throw new Error('Invalid SAML assertion signature');
        }
    } else {
        throw new Error('No signature found in SAML assertion');
    }
}

// Main function to process the SAML assertion
async function processSamlAssertion(base64Assertion) {
    try {
        // Step 1: Decode the SAML Assertion
        const decodedXml = decodeSamlAssertion(base64Assertion);

        // Step 2: Validate the signature using the external certificate
        validateSamlSignature(decodedXml);

        // Step 3: Parse the decoded XML
        const parsedSamlResponse = await parseSamlAssertion(decodedXml);

        // Step 4: Extract relevant assertions (NameID, Name, Email)
        return extractAssertions(parsedSamlResponse);
    } catch (err) {
        console.error('Error processing SAML assertion:', err);
        return null;
    }
}
