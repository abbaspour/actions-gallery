const {expect, describe, it, beforeEach} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

// Mock the necessary objects and methods
_jest.mock('axios');
_jest.mock('jsonwebtoken');
_jest.mock('jwks-rsa');
_jest.mock('auth0');

describe('onExecutePostLogin', () => {
    let mockEvent;
    let mockApi;

    beforeEach(() => {
        // Reset the mocks before each test
        _jest.resetAllMocks();

        // Mock event and API objects
        mockEvent = {
            transaction: {
                protocol: 'oidc-protocol',
                id: 'tx-id'
            },
            connection: {
                strategy: 'custom-strategy',
            },
            user: {
                identities: [],
                email: 'test@example.com',
            },
            client: {
                client_id: 'testClientId',
            },
            secrets: {
                domain: 'test.auth0.com',
            },
        };

        mockApi = {
            redirect: {
                sendUserTo: _jest.fn(),
            },
        };
    });

    it('should redirect to nestedAuthorizeURL', async () => {
        const {onExecutePostLogin} = require('./interactive-account-linking');

        await onExecutePostLogin(mockEvent, mockApi);

        // Expect sendUserTo to be called with the correct URL
        expect(mockApi.redirect.sendUserTo).toHaveBeenCalledWith(
            // eslint-disable-next-line
            expect.stringContaining('https://test.auth0.com/authorize?client_id=testClientId&redirect_uri=https%3A%2F%2Ftest.auth0.com%2Fcontinue&nonce=tx-id&response_type=code&prompt=login&connection=Users&login_hint=test%40example.com&scope=openid%20profile%20email&auth0Client=eyJuYW1lIjoiYXV0aDAuanMiLCJ2ZXJzaW9uIjoiOS4yNC4wIn0%3D')
        );
    });

    it('should not redirect for auth0 strategy', async () => {
        // Modify the event to have 'auth0' strategy
        mockEvent.connection.strategy = 'auth0';

        const {onExecutePostLogin} = require('./interactive-account-linking');

        await onExecutePostLogin(mockEvent, mockApi);

        // Expect sendUserTo not to be called
        expect(mockApi.redirect.sendUserTo).not.toHaveBeenCalled();
    });

    it('should not redirect for interactive_login protocol', async () => {
        // Modify the event to have 'interactive_login' protocol
        mockEvent.transaction.protocol = 'interactive_login';

        const {onExecutePostLogin} = require('./interactive-account-linking');

        await onExecutePostLogin(mockEvent, mockApi);

        // Expect sendUserTo not to be called
        expect(mockApi.redirect.sendUserTo).not.toHaveBeenCalled();
    });

});

