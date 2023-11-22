/**
 * Author: Amin Abbaspour <amin@okta.com>
 * Date: 2023-11-22
 * License: MIT (https://github.com/auth0/actions-galleryh/blob/main/LICENSE)
 */

const {expect, test} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

const {onExecutePostLogin} = require('./post-login-fetch-customer_id');

test('post-login-first-time', async () => {
    const mockUserFunction = _jest.fn();
    const mockIdTokenFunction = _jest.fn();

    const mockEvent = {
        user: {email: 'test@example.com', app_metadata: {}}
    };
    const mockApi = {
        user: {setAppMetadata: mockUserFunction},
        idToken: {setCustomClaim: mockIdTokenFunction}
    };

    await onExecutePostLogin(mockEvent, mockApi);

    expect(mockUserFunction).toBeCalledWith(
        'customer_id',
        '55502f40dc8b7c769880b10874abc9d0'
    );
    expect(mockIdTokenFunction).toBeCalledWith(
        'customer_id',
        '55502f40dc8b7c769880b10874abc9d0'
    );

});

test('post-login-second-time', async () => {
    const mockUserFunction = _jest.fn();
    const mockIdTokenFunction = _jest.fn();

    const mockEvent = {
        user: {email: 'test@example.com', app_metadata: {customer_id: '123'}}
    };
    const mockApi = {
        user: {setAppMetadata: mockUserFunction},
        idToken: {setCustomClaim: mockIdTokenFunction}
    };

    await onExecutePostLogin(mockEvent, mockApi);

    expect(mockIdTokenFunction).toBeCalledWith(
        'customer_id',
        '123'
    );
    expect(mockUserFunction).not.toHaveBeenCalled();
});
