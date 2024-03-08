const { onExecutePreUserRegistration } = require('./pre-reg-domain-deny-list');

const {expect, describe, it, beforeEach} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

describe('onExecutePreUserRegistration', () => {
    let mockEvent;
    let mockApi;

    beforeEach(() => {
        // Reset the mocks before each test
        _jest.resetAllMocks();

        // Mock event and API objects
        mockEvent = {
            user: {
                email: 'test@valid.com',
            },
        };

        mockApi = {
            access: {
                deny: _jest.fn(),
            },
        };
    });

    it('should allow registration for a valid email domain', async () => {
        await onExecutePreUserRegistration(mockEvent, mockApi);

        // Expect access.deny not to be called
        expect(mockApi.access.deny).not.toHaveBeenCalled();
    });

    it('should deny registration for a disallowed email domain', async () => {
        // Modify the email to have a disallowed domain
        mockEvent.user.email = 'test@disposable.com';

        await onExecutePreUserRegistration(mockEvent, mockApi);

        // Expect access.deny to be called with the correct message
        expect(mockApi.access.deny).toHaveBeenCalledWith('something went wrong', 'denied domain');
    });

    it('should deny registration for another disallowed email domain', async () => {
        // Modify the email to have another disallowed domain
        mockEvent.user.email = 'test@example.com';

        await onExecutePreUserRegistration(mockEvent, mockApi);

        // Expect access.deny to be called with the correct message
        expect(mockApi.access.deny).toHaveBeenCalledWith('something went wrong', 'denied domain');
    });

});
