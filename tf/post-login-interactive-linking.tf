resource "auth0_action" "interactive_account_linking" {
  name    = "Interactive Account Linking Nested Transaction"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/account-linking/interactive-account-linking.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  dependencies {
    name    = "auth0-js"
    version = "9.23.3"
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

  dependencies {
    name    = "auth0"
    version = "4.1.0"
  }

  secrets {
    name  = "clientId"
    value = auth0_client.m2m_client_update_users.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.m2m_client_update_users.client_secret
  }

  secrets {
    name  = "domain"
    value = var.auth0_domain
  }
}

/*
resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.interactive_account_linking.id
    display_name = auth0_action.interactive_account_linking.name
  }
}
*/