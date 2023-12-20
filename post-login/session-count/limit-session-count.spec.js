const { onExecutePostLogin } = require('./limit-session-count');

const {expect, describe, it, xit, beforeEach} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

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
            },
            user: {
                user_id: 'testUserId',
            },
            session: {
                id: 'testSessionId',
            },
            secrets: {
                REDIS_URL: 'test-redis-url',
                REDIS_PASSWORD: 'test-redis-password',
                SESSION_LIFETIME: 3600, // 1 hour
                MAX_SESSION: 5,
            },
        };

        mockApi = {
            access: {
                deny: _jest.fn(),
            },
        };
    });

    it('should add and count sessions successfully', async () => {
        const mockRedisInstance = {
            set: _jest.fn().mockResolvedValue('OK'),
            scan: _jest.fn().mockResolvedValue(['0', ['testUserId:testSessionId']]),
        };

        // Mock Redis constructor to return the mock instance
        const Redis = _jest.fn().mockImplementation(() => { return mockRedisInstance; });

        _jest.mock('ioredis', () => {
            return Redis;
        });
        
        await onExecutePostLogin(mockEvent, mockApi);

        // Expect set to be called with the correct parameters
        expect(mockRedisInstance.set).toHaveBeenCalledWith(
            'testUserId:testSessionId',
            '1',
            'EX',
            mockEvent.secrets.SESSION_LIFETIME
        );

        // Expect scan to be called with the correct parameters
        expect(mockRedisInstance.scan).toHaveBeenCalledWith(
            '0',
            'MATCH',
            'testUserId:*',
            'COUNT',
            10
        );

        // Expect log to be called with the correct message
        //expect(console.log).toHaveBeenCalledWith('session count for user testUserId: 1');

        // Expect access.deny not to be called
        expect(mockApi.access.deny).not.toHaveBeenCalled();
    });

    xit('should deny access if max sessions reached', async () => {
        const mockRedisInstance = {
            set: _jest.fn().mockResolvedValue('OK'),
            scan: _jest.fn().mockResolvedValue(['0', ['testUserId:testSessionId', 'testUserId:testSessionId2', 'testUserId:testSessionId3']]),
        };

        const Redis = _jest.fn().mockImplementation(() => { return mockRedisInstance; });

        _jest.mock('ioredis', () => {
            return Redis;
        });

        await onExecutePostLogin(mockEvent, mockApi);

        // Expect set to be called with the correct parameters
        expect(mockRedisInstance.set).toHaveBeenCalledWith(
            'testUserId:testSessionId',
            '1',
            'EX',
            mockEvent.secrets.SESSION_LIFETIME
        );

        // Expect scan to be called with the correct parameters
        expect(mockRedisInstance.scan).toHaveBeenCalledWith(
            '0',
            'MATCH',
            'testUserId:*',
            'COUNT',
            10
        );

        // Expect access.deny to be called with the correct message
        expect(mockApi.access.deny).toHaveBeenCalledWith('max sessions reached');

        // Expect log to be called with the correct message
        //expect(console.log).toHaveBeenCalledWith('session count for user testUserId: 5');
    });

});
