exports.onExecutePostLogin = async (event, api) => {
    if (event?.transaction?.protocol !== 'samlp') return;

    const encodedSAML = event?.request?.query?.SAMLRequest;

    const zlib = require('zlib');
    const uriDecoded = decodeURIComponent(encodedSAML);
    const b64decoded = Buffer.from(uriDecoded, 'base64');
    const decodedSAML = zlib.inflateRawSync(b64decoded).toString();

    const xmlParser = require('xm12json');

    const jsonObject = xmlParser.toJson(decodedSAML, {
        object: true, sanitize: true, trim: true
    });

    const conditions = jsonObject['samlp:AuthnRequest']['saml:Conditions'];
    console.log(conditions);
};