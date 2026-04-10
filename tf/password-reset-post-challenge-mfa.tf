resource "auth0_action" "enforce_mfa_password_reset" {
  code    = file("../password-reset-post-challenge/password-reset-mfa-challenge/password-reset-mfa-challenge.js")
  deploy  = true
  name    = "enforce-mfa-password-reset2"
  runtime = "node22"
  supported_triggers {
    id      = "password-reset-post-challenge"
    version = "v1"
  }
}

resource "auth0_trigger_actions" "password_reset_post_challenge" {
  trigger = "password-reset-post-challenge"
  actions {
    display_name = auth0_action.enforce_mfa_password_reset.name
    id           = auth0_action.enforce_mfa_password_reset.id
  }
}