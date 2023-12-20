const { onExecuteSendPhoneMessage } = require('./send-phone-message-allowed-country-list');

const {expect, beforeEach, describe, it} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

_jest.mock('twilio');

describe('onExecuteSendPhoneMessage', () => {
    let mockEvent;
    let mockApi;
    let mockTwilioClient;

    beforeEach(() => {
        // Reset the mocks before each test
        _jest.resetAllMocks();

        // Mock event and API objects
        mockEvent = {
            secrets: {
                TWILIO_ACCOUNT_SID: 'test-account-sid',
                TWILIO_AUTH_TOKEN: 'test-auth-token',
                TWILIO_PHONE_NUMBER: 'test-phone-number',
            },
            message_options: {
                action: 'enrollment',
                text: 'Test message',
                recipient: '+6143456789',
                message_type: 'sms',
            },
            user: {
                user_id: 'testUserId',
                email: 'test@example.com',
            },
        };

        mockApi = {};

        // Mock Twilio client
        mockTwilioClient = {
            messages: {
                create: _jest.fn().mockResolvedValue('Twilio Message Sent'),
            },
        };
        _jest.mock('twilio', () => () => mockTwilioClient);
    });

    it('should send enrollment message successfully', async () => {
        await onExecuteSendPhoneMessage(mockEvent, mockApi);

        // Expect sendSMSToGateway to be called with the correct parameters
        expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
            body: 'Test message',
            from: 'test-phone-number',
            to: '+6143456789',
        });
    });

    it('should send second-factor authentication message successfully', async () => {
        // Modify the action to be 'second-factor-authentication'
        mockEvent.message_options.action = 'second-factor-authentication';

        await onExecuteSendPhoneMessage(mockEvent, mockApi);

        // Expect sendSMSToGateway to be called with the correct parameters
        expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
            body: 'Test message',
            from: 'test-phone-number',
            to: '+6143456789',
        });
    });

    it('should throw an error for enrollment from a disallowed country', async () => {
        // Modify the recipient to have a disallowed country code
        mockEvent.message_options.recipient = '+1234567890';

        await expect(onExecuteSendPhoneMessage(mockEvent, mockApi)).rejects.toThrowError(
            'Error: Someone tried to enroll with phone number +1234567890  from country US'
        );

        // Expect sendSMSToGateway not to be called
        expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });

});
