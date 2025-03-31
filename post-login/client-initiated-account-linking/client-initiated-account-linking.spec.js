const {expect, describe, it, beforeEach} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

// Mock the necessary objects and methods
_jest.mock('axios');
_jest.mock('jwks-rsa');

const mockLinkMethod = _jest.fn();
const mockUnlinkMethod = _jest.fn();

_jest.mock('auth0', () => ({
    ManagementClient: _jest.fn().mockReturnValue({
        users: {
            link: mockLinkMethod,
            unlink: mockUnlinkMethod
        }
    })
}));

_jest.mock('jsonwebtoken', () => ({
    verify: _jest.fn().mockImplementation((id_token, getKey, signature, cb) => {
        return cb(null, {sub: 'auth0|123', auth_time: Math.floor(Date.now() / 1000)});
    }),
}));

describe('onExecutePostLogin', () => {
    let mockEvent;
    let mockApi;
    let onExecutePostLogin;

    beforeEach(() => {
        // Reset the mocks before each test
        _jest.resetModules();

        onExecutePostLogin = require('./client-initiated-account-linking').onExecutePostLogin;

        // Mock event and API objects
        mockEvent = {
            transaction: {
                protocol: 'oidc-protocol',
                id: 'tx-id',
                requested_scopes: ['link_account']
            },
            connection: {
                strategy: 'custom-strategy',
            },
            user: {
                identities: [],
                user_id: 'auth0|123',
                email: 'test@example.com',
            },
            client: {
                client_id: 'testClientId',
            },
            secrets: {
                domain: 'test.auth0.com',
                clientId: 'companionClientId'
            },
            resource_server: {
                identifier: 'my-account'
            },
            request: {
                ip: '1.2.3.4',
                query: {
                    id_token_hint: 'some_id_token',
                    requested_connection: 'google-oauth2'
                }
            },
        };

        mockApi = {
            redirect: {
                sendUserTo: _jest.fn(),
            },
            access: {
                deny: _jest.fn(),
            },
            noop: _jest.fn()
        };
    });

    it('should exit for non-interactive ropg protocols', async () => {
        mockEvent.transaction.protocol = 'oauth2-resource-owner';
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.noop).toHaveBeenCalledWith('protocol is not interactive: oauth2-resource-owner');
    });

    it('should exit if running internal transaction', async () => {
        mockEvent.client.client_id = mockEvent.secrets.clientId;
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.noop).toHaveBeenCalledWith('running inner transaction');
    });

    it('should exit if not expected resource-server', async () => {
        mockEvent.resource_server.identifier = 'my-other-api';
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.noop).toHaveBeenCalledWith('invalid request');
    });

    it('should exit if empty scopes', async () => {
        mockEvent.transaction.requested_scopes = null;
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.noop).toHaveBeenCalledWith('invalid request');
    });

    it('should exit if scope not link or unlink', async () => {
        mockEvent.transaction.requested_scopes = ['some-other-scope'];
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.noop).toHaveBeenCalledWith('invalid request');
    });

    it('should exit if both link and unlink requested', async () => {
        mockEvent.transaction.requested_scopes = ['link_account', 'unlink_account'];
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.noop).toHaveBeenCalledWith('invalid request');
    });

    it('should exit if no id_token_hint passed', async () => {
        delete mockEvent.request.query.id_token_hint;
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('no id_token_hint present');
    });

    it('should exit if no requested_connection passed', async () => {
        delete mockEvent.request.query.requested_connection;
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('no requested_connection requested');
    });

    it('should redirect if user is already linked to requested connection', async () => {
        mockEvent.user.identities.push({
            connection: 'google-oauth2'
        });
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.redirect.sendUserTo).toHaveBeenCalledWith(
            'https://test.auth0.com/authorize?client_id=companionClientId&redirect_uri=https%3A%2F%2Ftest.auth0.com%2Fcontinue&nonce=cb2515ab1456f97027c903f2702f7d06&response_type=code&prompt=login&max_age=0&connection=google-oauth2&login_hint=test%40example.com&scope=openid%20profile%20email'
        );
    });

    it('should exit unlink if user is does not have link to requested connection', async () => {
        mockEvent.transaction.requested_scopes[0] = 'unlink_account';
        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith(`user ${mockEvent.user.user_id} does not have profile against connection: ${mockEvent.request.query.requested_connection}`);
    });

    it('should exit if id_token_hint invalid', async () => {
        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(new Error('jwt expired'));
        });

        await onExecutePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('id_token_hint verification failed');
    });

    it('should exit if id_token_hint sub mismatch', async () => {

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation(function (id_token, getKey, signature, cb) {
            return cb(null, {sub: 'auth0|321', auth_time: Math.floor(Date.now() / 1000)});
        });

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.access.deny).toHaveBeenCalledWith(`sub mismatch. expected ${mockEvent.user.user_id} received auth0|321`);
    });


    it('should redirect to nestedAuthorizeURL', async () => {

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.redirect.sendUserTo).toHaveBeenCalledWith(
            expect.stringContaining('https://test.auth0.com/authorize?client_id=companionClientId&redirect_uri=https%3A%2F%2Ftest.auth0.com%2Fcontinue&nonce=cb2515ab1456f97027c903f2702f7d06&response_type=code&prompt=login&max_age=0&connection=google-oauth2&login_hint=test%40example.com&scope=openid%20profile%20email')
        );
    });

    it('should redirect to nestedAuthorizeURL with one connection_scope', async () => {

        mockEvent.request.query.requested_connection_scopes = 'https://www.googleapis.com/auth/calendar.readonly';
        await onExecutePostLogin(mockEvent, mockApi);

        // Expect sendUserTo to be called with the correct URL
        expect(mockApi.redirect.sendUserTo).toHaveBeenCalledWith(
            'https://test.auth0.com/authorize?client_id=companionClientId&redirect_uri=https%3A%2F%2Ftest.auth0.com%2Fcontinue&nonce=cb2515ab1456f97027c903f2702f7d06&response_type=code&prompt=login&max_age=0&connection=google-oauth2&login_hint=test%40example.com&scope=openid%20profile%20email&connection_scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly'
        );
    });

    it('should redirect to nestedAuthorizeURL with two connection_scope', async () => {

        mockEvent.request.query.requested_connection_scopes = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly';
        await onExecutePostLogin(mockEvent, mockApi);

        // Expect sendUserTo to be called with the correct URL
        expect(mockApi.redirect.sendUserTo).toHaveBeenCalledWith(
            'https://test.auth0.com/authorize?client_id=companionClientId&redirect_uri=https%3A%2F%2Ftest.auth0.com%2Fcontinue&nonce=cb2515ab1456f97027c903f2702f7d06&response_type=code&prompt=login&max_age=0&connection=google-oauth2&login_hint=test%40example.com&scope=openid%20profile%20email&connection_scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events.readonly'
        );
    });

    it('should redirect for auth0 strategy', async () => {
        // Modify the event to have 'auth0' strategy
        mockEvent.connection.strategy = 'auth0';

        //const {onExecutePostLogin} = require('../action/action');

        await onExecutePostLogin(mockEvent, mockApi);

        // Expect sendUserTo not to be called
        expect(mockApi.redirect.sendUserTo).toHaveBeenCalled();
    });

    it('should not redirect for interactive_login protocol', async () => {
        // Modify the event to have 'interactive_login' protocol
        mockEvent.transaction.protocol = 'interactive_login';

        //const {onExecutePostLogin} = require('../action/action');

        await onExecutePostLogin(mockEvent, mockApi);

        // Expect sendUserTo not to be called
        expect(mockApi.redirect.sendUserTo).not.toHaveBeenCalled();
    });

});

describe('onContinuePostLogin', () => {
    let mockEvent;
    let mockApi;
    let onContinuePostLogin;

    beforeEach(() => {
        // Reset the mocks before each test
        _jest.resetModules();

        onContinuePostLogin = require('./client-initiated-account-linking').onContinuePostLogin;

        // Mock event and API objects
        mockEvent = {
            transaction: {
                protocol: 'oidc-protocol',
                id: 'tx-id',
                requested_scopes: ['link_account']
            },
            connection: {
                strategy: 'custom-strategy',
            },
            user: {
                identities: [
                    {
                        user_id: '123',
                        provider: 'auth0'
                    }
                ],
                user_id: 'auth0|123',
                email: 'test@example.com',
            },
            client: {
                client_id: 'testClientId',
            },
            secrets: {
                domain: 'test.auth0.com',
                clientId: 'companionClientId'
            },
            resource_server: {
                identifier: 'my-account'
            },
            request: {
                ip: '1.2.3.4',
                query: {
                    code: 'authorization-code',
                    state: 'internal-state'
                },
            },
        };

        mockApi = {
            redirect: {
                sendUserTo: _jest.fn(),
            },
            access: {
                deny: _jest.fn(),
            },
            cache: {
                get: _jest.fn(),
            },
            noop: _jest.fn()
        };
    });

    it('continue should exit if code missing', async () => {
        delete mockEvent.request.query.code;
        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('missing code');
    });

    it('continue should exit if not expected resource-server', async () => {
        mockEvent.resource_server.identifier = 'my-other-api';
        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('invalid request');
    });

    it('continue should exit if empty scopes', async () => {
        mockEvent.transaction.requested_scopes = null;
        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('invalid request');
    });

    it('continue should exit if scope not link or unlink', async () => {
        mockEvent.transaction.requested_scopes = ['some-other-scope'];
        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('invalid request');
    });

    it('continue should exit if both link and unlink requested', async () => {
        mockEvent.transaction.requested_scopes = ['link_account', 'unlink_account'];
        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('invalid request');
    });

    it('continue should exit if exchange fails', async () => {
        const axios = require('axios');
        axios.mockImplementation(function () {
            throw new Error('timeout');
        });

        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('error in exchange');
    });

    it('continue should exit if exchange returns invalid data', async () => {
        const axios = require('axios');
        axios.mockImplementation(() => 'garbage');

        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('error in exchange');
    });

    it('continue should exit if exchange returns invalid id_token', async () => {
        const axios = require('axios');
        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(new Error('jwt expired'));
        });

        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('error in exchange');
    });

    it('continue should exit if linking returns invalid nonce', async () => {

        const axios = require('axios');
        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'auth0|123', nonce: 'some-nonce'});
        });

        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('nonce mismatch');
    });

    it('continue should exit link if already linked', async () => {

        const axios = require('axios');
        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'auth0|123', nonce: 'cb2515ab1456f97027c903f2702f7d06'});
        });

        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.noop).toHaveBeenCalledWith('user already linked');
    });

    it('continue should exit if email is not verified', async () => {
        const axios = require('axios');
        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'auth0|456', nonce: 'cb2515ab1456f97027c903f2702f7d06', email_verified: false});
        });

        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('email not verified for nested user');
    });

    it('continue should exit unlink if user_id missing in id_token', async () => {
        const axios = require('axios');

        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'auth0|123'});
        });

        mockEvent.transaction.requested_scopes = ['unlink_account'];
        await onContinuePostLogin(mockEvent, mockApi);
        expect(mockApi.access.deny).toHaveBeenCalledWith('missing user_id claim');
    });

    it('continue should link for valid input', async () => {
        const axios = require('axios');

        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'google-oauth2|abc', nonce: 'cb2515ab1456f97027c903f2702f7d06', email_verified: true});
        });

        mockApi.cache.get.mockReturnValue({ value: 'some-m2m-token'});

        await onContinuePostLogin(mockEvent, mockApi);

        expect(mockLinkMethod).toHaveBeenCalledWith({id: 'auth0|123'}, {user_id: 'abc', provider: 'google-oauth2'});
    });


    it('continue should exit if link throws error', async () => {
        const axios = require('axios');

        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'google-oauth2|abc', nonce: 'cb2515ab1456f97027c903f2702f7d06', email_verified: true});
        });

        mockApi.cache.get.mockReturnValue({ value: 'some-m2m-token'});

        mockLinkMethod.mockImplementation(() => { throw new Error(); });

        await onContinuePostLogin(mockEvent, mockApi);

        expect(mockApi.access.deny).toHaveBeenCalledWith('error linking');
    });

    it('continue should unlink for valid input', async () => {
        const axios = require('axios');

        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'auth0|123', nonce: 'google-oauth2|abc'});
        });

        mockApi.cache.get.mockReturnValue({ value: 'some-m2m-token'});

        mockEvent.user.identities.push({
            provider: 'google-oauth2',
            connection: 'google-oauth2',
            user_id: 'abc'
        });

        mockEvent.transaction.requested_scopes = ['unlink_account'];

        await onContinuePostLogin(mockEvent, mockApi);

        expect(mockUnlinkMethod).toHaveBeenCalledWith({id: 'auth0|123', user_id: 'abc', provider: 'google-oauth2'});
    });

    it('continue should exit if unlink throws error', async () => {
        const axios = require('axios');

        axios.mockImplementation(async function () {
            return {data: {id_token: 'some-id-token'}};
        });

        const jwt = require('jsonwebtoken');

        jwt.verify.mockImplementation((id_token, getKey, signature, cb) => {
            return cb(null, {sub: 'auth0|123', nonce: 'google-oauth2|abc'});
        });

        mockApi.cache.get.mockReturnValue({ value: 'some-m2m-token'});

        mockEvent.user.identities.push({
            provider: 'google-oauth2',
            connection: 'google-oauth2',
            user_id: 'abc'
        });

        mockEvent.transaction.requested_scopes = ['unlink_account'];

        mockUnlinkMethod.mockImplementation(() => { throw new Error(); });

        await onContinuePostLogin(mockEvent, mockApi);

        expect(mockUnlinkMethod).toHaveBeenCalledWith({id: 'auth0|123', user_id: 'abc', provider: 'google-oauth2'});
        expect(mockApi.access.deny).toHaveBeenCalledWith('error unlinking');
    });

});
