resource "auth0_action" "enforce_mfa_password_reset" {
  code    = file("../password-reset-post-challenge/password-reset-mfa-challenge/password-reset-mfa-challenge.js")
  deploy  = true
  name    = "enforce-mfa-password-reset"
  runtime = "node18"
  supported_triggers {
    id      = "password-reset-post-challenge"
    version = "v1"
  }
}

resource "auth0_trigger_actions" "password_reset_post_challenge" {
  trigger = "password-reset-post-challenge"
  actions {
    display_name = "enforce-mfa-password-reset"
    id           = auth0_action.enforce_mfa_password_reset.id
  }
}