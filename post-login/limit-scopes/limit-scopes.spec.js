const {expect, describe, it} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');
const {onExecutePostLogin} = require('./limit-scopes');

describe('onExecutePostLogin', () => {

    it('should allow not allow extra scopes', async () => {
        const mockEvent = {
            transaction: {
                'requested_scopes': [
                    'offline_access',
                    'read:clients',
                    'update:clients'
                ],
            },
            resource_server: {
                identifier: 'https://*.test.auth0c.com/api/v2/'
            },
            client: {
                metadata: {
                    partner: 'true'
                }
            },
            secrets: {
                domain: 'config.test.auth0c.com',
            },
        };

        const mockApi = {
            access: {
                deny: _jest.fn(),
            }
        };

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.access.deny).toBeCalled();
    });

    it('should allow normal scopes', async () => {
        const mockEvent = {
            transaction: {
                'requested_scopes': [
                    'offline_access',
                    'read:clients'
                ],
            },
            resource_server: {
                identifier: 'https://*.test.auth0c.com/api/v2/'
            },
            client: {
                metadata: {
                    partner: 'true'
                }
            },
            secrets: {
                domain: 'config.test.auth0c.com',
            },
        };

        const mockApi = {
            access: {
                deny: _jest.fn(),
            }
        };

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.access.deny).not.toBeCalled();
    });


    it('should skip normal clients', async () => {
        const mockEvent = {
            transaction: {
                'requested_scopes': [
                    'offline_access',
                    'read:clients',
                    'update:clients'
                ],
            },
            resource_server: {
                identifier: 'https://*.test.auth0c.com/api/v2/'
            },
            client: {
                metadata: {
                }
            },
            secrets: {
                domain: 'config.test.auth0c.com',
            },
        };

        const mockApi = {
            access: {
                deny: _jest.fn(),
            }
        };

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.access.deny).not.toBeCalled();

    });


    it('should match RS identifier regex', async () => {
        const mockEvent = {
            transaction: {
                'requested_scopes': [
                    'offline_access',
                    'read:clients',
                    'update:clients'
                ],
            },
            resource_server: {
                identifier: 'https://tenant.test.auth0c.com/api/v2/'
            },
            client: {
                metadata: {
                    partner: 'true'
                }
            },
            secrets: {
                domain: 'config.test.auth0c.com',
            },
        };

        const mockApi = {
            access: {
                deny: _jest.fn(),
            }
        };

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.access.deny).toBeCalled();

    });

    it('should not fail for dx-dpp', async () => {
        const mockEvent = {
            transaction: {
                requested_scopes: [
                    'offline_access',
                    'read:clients',
                    'create:clients'
                ],
            },

        };
    });
});

