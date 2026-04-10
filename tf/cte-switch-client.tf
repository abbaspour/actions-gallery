resource "auth0_action" "switch-client-token-exchange" {
  name    = "switch client token exchange2"
  runtime = "node22"
  deploy  = true
  code = file("../custom-token-exchange/switch-client/switch-client.js")

  supported_triggers {
    id      = "custom-token-exchange"
    version = "v1"
  }

  dependencies {
    name    = "jsonwebtoken"
    version = "9.0.2"
  }

  dependencies {
    name    = "jwks-rsa"
    version = "3.1.0"
  }

}

resource "auth0_token_exchange_profile" "my_token_exchange_profile" {
  name               = "token-exchange-prof2"
  subject_token_type = "https://acme.com/cis-token2"
  action_id          = auth0_action.switch-client-token-exchange.id
  type               = "custom_authentication"
}
