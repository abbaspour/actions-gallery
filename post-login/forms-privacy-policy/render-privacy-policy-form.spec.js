const { onExecutePostLogin } = require('./render-privacy-policy-form');

describe('render-privacy-policy-form', () => {
  let event;
  let api;

  beforeEach(() => {
    event = {
      user: {
        app_metadata: {}
      },
      secrets: {
        PRIVACY_POLICY_FORM_ID: 'test-form-id'
      }
    };

    api = {
      prompt: {
        render: jest.fn()
      }
    };

    console.error = jest.fn();
  });

  it('should render privacy policy form when user has not accepted policies', async () => {
    event.user.app_metadata.privacy_policies = false;

    await onExecutePostLogin(event, api);

    expect(api.prompt.render).toHaveBeenCalledWith('test-form-id');
  });

  it('should render privacy policy form when privacy_policies is undefined', async () => {
    delete event.user.app_metadata.privacy_policies;

    await onExecutePostLogin(event, api);

    expect(api.prompt.render).toHaveBeenCalledWith('test-form-id');
  });

  it('should not render form when user has accepted privacy policies', async () => {
    event.user.app_metadata.privacy_policies = true;

    await onExecutePostLogin(event, api);

    expect(api.prompt.render).not.toHaveBeenCalled();
  });

  it('should log error and return when form ID secret is missing', async () => {
    delete event.secrets.PRIVACY_POLICY_FORM_ID;

    await onExecutePostLogin(event, api);

    expect(console.error).toHaveBeenCalledWith('PRIVACY_POLICY_FORM_ID secret not configured');
    expect(api.prompt.render).not.toHaveBeenCalled();
  });

  it('should log error and return when form ID secret is empty', async () => {
    event.secrets.PRIVACY_POLICY_FORM_ID = '';

    await onExecutePostLogin(event, api);

    expect(console.error).toHaveBeenCalledWith('PRIVACY_POLICY_FORM_ID secret not configured');
    expect(api.prompt.render).not.toHaveBeenCalled();
  });
});