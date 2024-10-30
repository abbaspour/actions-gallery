const axios = require('axios');
const fs = require('fs');
const https = require('https');

// Load your certificates and keys
const cert = fs.readFileSync('/Users/amin/project/pg/connectid/connectid-tools/rp-nodejs-sample-app/certs/transport.pem');
const key = fs.readFileSync('/Users/amin/project/pg/connectid/connectid-tools/rp-nodejs-sample-app/certs/transport.key');
const ca = fs.readFileSync('/Users/amin/project/pg/connectid/connectid-tools/rp-nodejs-sample-app/certs/connectid-sandbox-ca.pem');

// Set up the HTTPS agent with mTLS configuration
const agent = new https.Agent({
    cert,
    key,
    ca,
    rejectUnauthorized: false, // equivalent to -k option in curl
    minVersion: 'TLSv1.2',
});

// Request data parameters
const data = new URLSearchParams({
    client_id: 'https://rp.directory.sandbox.connectid.com.au/openid_relying_party/280518db-9807-4824-b080-324d94b45f6a',
    request: 'eyJ0eXAiOiJvYXV0aC1hdXRoei1yZXErand0IiwiYWxnIjoiUFMyNTYiLCJraWQiOiJyb0h0Z0JsUkZhcHFUSGJjOEV6WElJZ09fYnU1WUhsRWp4NzV2SWNheGZFIn0.ewogImlzcyI6Imh0dHBzOi8vcnAuZGlyZWN0b3J5LnNhbmRib3guY29ubmVjdGlkLmNvbS5hdS9vcGVuaWRfcmVseWluZ19wYXJ0eS8yODA1MThkYi05ODA3LTQ4MjQtYjA4MC0zMjRkOTRiNDVmNmEiLCAKICJjbGllbnRfaWQiOiJodHRwczovL3JwLmRpcmVjdG9yeS5zYW5kYm94LmNvbm5lY3RpZC5jb20uYXUvb3BlbmlkX3JlbHlpbmdfcGFydHkvMjgwNTE4ZGItOTgwNy00ODI0LWIwODAtMzI0ZDk0YjQ1ZjZhIiwKICJjb2RlX2NoYWxsZW5nZV9tZXRob2QiOiJTMjU2IiwKICJjb2RlX2NoYWxsZW5nZSI6Ik94aEZpN0RPZ2FMTlVvdmlBZWtaUVR0Szk2SEFXUlduZVVwc2JPdFVMWVkiLAogInJlc3BvbnNlX3R5cGUiOiJjb2RlIiwKICJub25jZSI6Im15bm9uY2UiLAogInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vdHBwLmxvY2FsaG9zdC9jYiIsCiAic2NvcGUiOiJvcGVuaWQiLAogInByb21wdCI6ImNvbnNlbnQiLAogInN0YXRlIjoiMTIzIiwKICJwdXJwb3NlIjoidGVzdGluZyIsCiAiYXVkIjogImh0dHBzOi8vYXV0aC5iYW5rMS5kaXJlY3Rvcnkuc2FuZGJveC5jb25uZWN0aWQuY29tLmF1LyIKfQo.pXhEtg6Y9bAsXnTsJaoCKnbnAeIWal9mJbfoYLtI7u7X6dtEcipU5LE8l1aP7w6e6Ujnztu92RL-Ecgv2yonTtdHJMobfHXwt4JN3xu1BqI5UUAnfQnu6Ab2j2yNZHJzlR26qocqO99kYpNAF61yGZoTmDOfhx1Ff2VfwVtNDJbNKkMwq5uT5cWDvKJnhoqONBl2H8OJolgIA8vA4-PyPMvxa8PFLuv13JBEfYXZk9GPjpSt_mM6-Hye8cPim3wRaJWWIlos5YYbgFBbbY35u1ysnF1VDZv9U7gdNZRXm4KRTwI-bG_Ek1Tyn7KmWQYqr_9JAVh2KEkYx0s4nF6eow',
    client_assertion: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJQUzI1NiIsImtpZCI6InJvSHRnQmxSRmFwcVRIYmM4RXpYSUlnT19idTVZSGxFang3NXZJY2F4ZkUifQ.eyJpYXQiOiAxNzMwMjY0OTY1LCAiaXNzIjoiaHR0cHM6Ly9ycC5kaXJlY3Rvcnkuc2FuZGJveC5jb25uZWN0aWQuY29tLmF1L29wZW5pZF9yZWx5aW5nX3BhcnR5LzI4MDUxOGRiLTk4MDctNDgyNC1iMDgwLTMyNGQ5NGI0NWY2YSIsInN1YiI6Imh0dHBzOi8vcnAuZGlyZWN0b3J5LnNhbmRib3guY29ubmVjdGlkLmNvbS5hdS9vcGVuaWRfcmVseWluZ19wYXJ0eS8yODA1MThkYi05ODA3LTQ4MjQtYjA4MC0zMjRkOTRiNDVmNmEiLCJhdWQiOiJodHRwczovL2F1dGguYmFuazEuZGlyZWN0b3J5LnNhbmRib3guY29ubmVjdGlkLmNvbS5hdSIsImV4cCI6MTczMDI2NTI2NSwgImp0aSI6ICIxNzMwMjY0OTY1In0.YU6GJsiiFFc3DH1gFIGeo78pPapzLAmf_aGC7-4s6bANXyAZHwzQ79Cqr9wUNdObTXavgrL4UsJJbU6sNR_RHw-Uvl2VmIe9yQrTDtA7QNxyresk8y0TNyj6tIumWalg5oWR3ZpVyYaj5LDhIuaUTZyohRNvYTNt3YcJo36-TZV1t6U1AjO8h3hVF5b1I1YXxJ3BtTGILTKNvnx6Nks6xGJIFHszw0Y1Zi0YjJs1bc1T5kxtpoht_li2efMDcVBwroexDx_NIHnXAEx_m5escup_EKok-NPxPN4UfgIGxUT1xC3vRq1U_tQ6GZImlhzgMN_vdzkRZ-F-uiF3RQjQHw',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
});

const headers = {
    'accept': 'application/json',
    'x-fapi-interaction-id': '1000432312242'
};

// Axios request configuration
axios.post('https://matls-auth.bank1.directory.sandbox.connectid.com.au/request', data, {
    httpsAgent: agent,
    headers,
})
    .then(response => {
        console.log('Response:', response.data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
