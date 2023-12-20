// Import the function to be tested
const {onExecutePostChallenge} = require('./password-reset-mfa-challenge');

const {expect, describe, it} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

// Mock the necessary objects and methods
const mockEvent = {
    user: {
        enrolledFactors: [
            {type: 'factor1'},
            {type: 'factor2'},
            // Add more factors if needed
        ]
    }
};

const mockApi = {
    authentication: {
        challengeWith: _jest.fn()
    }
};

// Test suite for onExecutePostChallenge
describe('onExecutePostChallenge', () => {
    it('should call api.authentication.challengeWith with the correct parameters', async () => {
        // Call the function with mock parameters
        await onExecutePostChallenge(mockEvent, mockApi);

        // Check if api.authentication.challengeWith is called with the expected arguments
        expect(mockApi.authentication.challengeWith).toHaveBeenCalledWith(
            {type: 'webauthn-roaming'},
            {additionalFactors: mockEvent.user.enrolledFactors.map((x) => ({type: x.type}))}
        );

        // Ensure that the function is not called with incorrect arguments
        expect(mockApi.authentication.challengeWith).not.toHaveBeenCalledWith(
            {type: 'incorrect-type'},
            {additionalFactors: []}
        );
    });
});

