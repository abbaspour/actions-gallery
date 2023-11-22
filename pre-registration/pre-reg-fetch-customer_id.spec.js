const {expect, test} = require('@jest/globals');
const {jest: _jest} = require('@jest/globals');

const {onExecutePreUserRegistration} = require('./pre-reg-fetch-customer_id');

test('pre-reg-sunny', async () => {
    const mockFunction = _jest.fn();
    const mockEvent = {user: {email: 'test@example.com'}};
    const mockApi = {user: {setAppMetadata: mockFunction}};
    await onExecutePreUserRegistration(mockEvent, mockApi);
    expect(mockFunction).toBeCalledWith(
        'customer_id',
        '55502f40dc8b7c769880b10874abc9d0'
    );
});

test('pre-reg-no-email', async () => {
    const mockFunction = _jest.fn();
    const mockEvent = {user: {given_name: 'name'}};
    const mockApi = {access: {deny: mockFunction}};
    await onExecutePreUserRegistration(mockEvent, mockApi);
    expect(mockFunction).toBeCalledWith(
        'no valid email'
    );
});