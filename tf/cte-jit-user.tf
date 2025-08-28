resource "auth0_action" "jit-user-token-exchange" {
  name    = "jit-user-token-exchange"
  runtime = "node22"
  deploy  = true
  code = file("../custom-token-exchange/cte-jit-user/cte-jit-user.js")

  supported_triggers {
    id      = "custom-token-exchange"
    version = "v1"
  }

  dependencies {
    name    = "jose"
    version = "6.0.11"
  }

}

resource "auth0_token_exchange_profile" "jit-user_exchange_profile" {
  name               = "jit-user-token-exchange-prof"
  subject_token_type = "urn:jit:id-token"
  action_id          = auth0_action.jit-user-token-exchange.id
  type               = "custom_authentication"
}
