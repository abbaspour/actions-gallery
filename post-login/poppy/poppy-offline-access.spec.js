const {expect, describe, it} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');
const {onExecutePostLogin} = require('./poppy-offline-access');

describe('onExecutePostLogin', () => {

    const newApi = () => ({
        noop: _jest.fn(),
        transaction: {
            addTargetScope: _jest.fn(),
        },
    });

    const newEvent = (overrides = {}) => ({
        agent: {agent_id: 'agt_123'},
        resource_server: {identifier: 'https://shop.abbaspour.net'},
        transaction: {target_scopes: ['orders:read']},
        ...overrides,
    });

    it('should skip if not an agent sign-in', async () => {
        const api = newApi();

        await onExecutePostLogin(newEvent({agent: undefined}), api);

        expect(api.noop).toBeCalledWith('no-agent');
        expect(api.transaction.addTargetScope).not.toBeCalled();
    });

    it('should skip if agent has no agent_id', async () => {
        const api = newApi();

        await onExecutePostLogin(newEvent({agent: {}}), api);

        expect(api.noop).toBeCalledWith('no-agent');
        expect(api.transaction.addTargetScope).not.toBeCalled();
    });

    it('should skip if not a poppy api', async () => {
        const api = newApi();

        await onExecutePostLogin(newEvent({resource_server: {identifier: 'https://other.example'}}), api);

        expect(api.noop).toBeCalledWith('not-poppy-api');
        expect(api.transaction.addTargetScope).not.toBeCalled();
    });

    it('should skip if no resource server', async () => {
        const api = newApi();

        await onExecutePostLogin(newEvent({resource_server: undefined}), api);

        expect(api.noop).toBeCalledWith('not-poppy-api');
        expect(api.transaction.addTargetScope).not.toBeCalled();
    });

    it('should skip if offline_access is already targeted', async () => {
        const api = newApi();

        await onExecutePostLogin(newEvent({transaction: {target_scopes: ['orders:read', 'offline_access']}}), api);

        expect(api.noop).toBeCalledWith('has-offline-access');
        expect(api.transaction.addTargetScope).not.toBeCalled();
    });

    it('should add offline_access for agent sign-in to poppy api', async () => {
        const api = newApi();

        await onExecutePostLogin(newEvent(), api);

        expect(api.transaction.addTargetScope).toBeCalledWith('offline_access');
    });

    it('should add offline_access when target_scopes is missing', async () => {
        const api = newApi();

        await onExecutePostLogin(newEvent({transaction: {}}), api);

        expect(api.transaction.addTargetScope).toBeCalledWith('offline_access');
    });
});
