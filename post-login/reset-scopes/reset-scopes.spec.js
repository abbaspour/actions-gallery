const {expect, describe, it} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');
const {onExecutePostLogin} = require('./reset-scopes');

describe('onExecutePostLogin', () => {

    const mockApi = {
        noop: _jest.fn(),
    };

    it('should only target my rs', async () => {
        const mockEvent = {
            resource_server: {
                identifier: 'other.rs'
            },
        };

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.noop).toBeCalledWith('no-my-rs');
    });

    it('should skip if no scopes', async () => {
        const mockEvent = {
            resource_server: {
                identifier: 'my.rs'
            }
        };

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.noop).toBeCalledWith('no-scopes');
    });


    it('should reset scopes for my rs', async () => {

        const mockEvent = {
            transaction: {
                requested_scopes: [
                    's1',
                    's2',
                    's3'
                ],
            },
            resource_server: {
                identifier: 'my.rs'
            }
        };

        const mockApi = {
            accessToken: {
                removeScope: _jest.fn(),
                addScope: _jest.fn(),
            }
        };

        await onExecutePostLogin(mockEvent, mockApi);

        expect(mockApi.accessToken.removeScope).toBeCalledTimes(3);
        expect(mockApi.accessToken.addScope).toBeCalledWith('s1');

    });
});

