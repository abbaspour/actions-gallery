/**
 * Author: Amin Abbaspour
 * Date: 2023-11-22
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 */

const {expect, test, beforeEach} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

const [clientId, clientSecret, domain] = ['xxx', 'xxx', 'xxx.auth0.com'];

beforeEach(() => {
    _jest.resetModules();
});

const AuthenticationClient = _jest.fn().mockImplementation((domain, clientId, clientSecret) => {
    return {
        oauth: {
            clientCredentialsGrant: _jest.fn().mockImplementation((audience) => {
                return {data: {access_token: 'xxx', expires_in: 86400}};
            })
        }
    };
});

test('no-link-unverified-email', async () => {
    const mockApi = {
        nope: _jest.fn()
    };

    const mockEvent = {
        user: {
            email: 'a.abbaspour+01@gmail.com',
            user_id: 'auth0|60a47ce4689a830068e26ece',
            email_verified: false,
            identities: [],
            app_metadata: {'customer_id': 'a'}
        },
        secrets: {clientId, clientSecret, domain}
    };

    const {onExecutePostLogin} = require('./silent-account-linking');
    await onExecutePostLogin(mockEvent, mockApi);

    expect(mockApi.nope).toBeCalledWith(
        'email not verified'
    );
});

test('linking-both-have-customer-id', async () => {

    const mockUserFunction = _jest.fn();
    const mockLink = _jest.fn();

    const ManagementClient = _jest.fn().mockImplementation((domain, token) => {
        return {
            usersByEmail: {
                getByEmail: _jest.fn().mockImplementation((email) => {
                    return {
                        data: [
                            {
                                'email': 'a.abbaspour+01@gmail.com',
                                'email_verified': 'true',
                                'identities': [
                                    {
                                        'user_id': 'amin01|auth0|5b5e65d30368302c7d1223a6',
                                        'provider': 'samlp',
                                        'connection': 'amin01',
                                        'isSocial': false
                                    }
                                ],
                                app_metadata: {
                                    'customer_id': 'b'
                                },
                                'user_id': 'samlp|amin01|auth0|5b5e65d30368302c7d1223a6'
                            }
                        ]
                    };
                })
            },
            users: {
                link: mockLink
            },
            getAccessToken: _jest.fn()
        };
    });

    const mockEvent = {
        user: {
            email: 'a.abbaspour+01@gmail.com',
            user_id: 'auth0|60a47ce4689a830068e26ece',
            email_verified: true,
            identities: [],
            app_metadata: {'customer_id': 'a'}
        },
        secrets: {clientId, clientSecret, domain}
    };


    const mockApi = {
        user: {setAppMetadata: mockUserFunction},
        cache: {
            get: _jest.fn().mockImplementation(() => {
                return 'token';
            }),
            set: _jest.fn()
        }
    };

    //_jest.resetModules();
    _jest.mock('auth0', () => {
        return {ManagementClient, AuthenticationClient};
    });

    const {onExecutePostLogin} = require('./silent-account-linking');
    await onExecutePostLogin(mockEvent, mockApi);

    expect(mockLink).toBeCalledWith(
        {id: 'auth0|60a47ce4689a830068e26ece'},
        {provider: 'samlp', user_id: 'samlp|amin01|auth0|5b5e65d30368302c7d1223a6'}
    );

    expect(mockUserFunction).toBeCalledWith(
        'customer_id', ['a', 'b']
    );

});


test('linking-only-primary-has-customer-id', async () => {

    const mockUserFunction = _jest.fn();
    const mockLink = _jest.fn();

    const ManagementClient = _jest.fn().mockImplementation((domain, token) => {
        return {
            usersByEmail: {
                getByEmail: _jest.fn().mockImplementation((email) => {
                    return {
                        data: [
                            {
                                'email': 'a.abbaspour+01@gmail.com',
                                'email_verified': 'true',
                                'identities': [
                                    {
                                        'user_id': 'amin01|auth0|5b5e65d30368302c7d1223a6',
                                        'provider': 'samlp',
                                        'connection': 'amin01',
                                        'isSocial': false
                                    }
                                ],
                                app_metadata: {},
                                'user_id': 'samlp|amin01|auth0|5b5e65d30368302c7d1223a6'
                            }
                        ]
                    };
                })
            },
            users: {
                link: mockLink
            },
            getAccessToken: _jest.fn()
        };
    });

    //_jest.resetModules();
    _jest.mock('auth0', () => {
        return {ManagementClient, AuthenticationClient};
    });

    const mockEvent = {
        user: {
            email: 'a.abbaspour+01@gmail.com',
            user_id: 'auth0|60a47ce4689a830068e26ece',
            email_verified: true,
            identities: [],
            app_metadata: {'customer_id': 'a'}
        },
        secrets: {clientId, clientSecret, domain}
    };


    const mockApi = {
        user: {setAppMetadata: mockUserFunction},
        cache: {get: _jest.fn(), set: _jest.fn()}
    };

    const {onExecutePostLogin} = require('./silent-account-linking');
    await onExecutePostLogin(mockEvent, mockApi);

    expect(mockLink).toBeCalledWith(
        {id: 'auth0|60a47ce4689a830068e26ece'},
        {provider: 'samlp', user_id: 'samlp|amin01|auth0|5b5e65d30368302c7d1223a6'}
    );

    expect(mockUserFunction).not.toHaveBeenCalled();

});

