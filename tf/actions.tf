resource "auth0_action" "nest_transaction" {
  name    = "Nested Transaction"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/nested-transaction.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  dependencies {
    name    = "auth0-js"
    version = "9.23.3"
  }

  dependencies {
    name    = "uuid"
    version = "9.0.1"
  }

  dependencies {
    name    = "axios"
    version = "1.6.2"
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

resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.nest_transaction.id
    display_name = auth0_action.nest_transaction.name
  }
}