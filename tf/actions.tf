resource "auth0_client" "account_linking_m2m_client" {
  name  = "M2M Account Linking"
  app_type = "non_interactive"
  grant_types = [
    "client_credentials"
  ]
}

data "auth0_resource_server" "api_v2" {
  identifier = "https://${var.auth0_domain}/api/v2/"
}

data "auth0_client" "m2m_client" {
  depends_on = [auth0_client.account_linking_m2m_client]
  name = "M2M Account Linking"
  client_id = auth0_client.account_linking_m2m_client.client_id
}

resource "auth0_client_grant" "m2m_client_scopes" {
  client_id = auth0_client.account_linking_m2m_client.client_id
  audience = data.auth0_resource_server.api_v2.identifier
  scopes = ["update:users"]
}

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

  dependencies {
    name    = "auth0"
    version = "4.1.0"
  }

  secrets {
    name  = "clientId"
    value = auth0_client.account_linking_m2m_client.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.m2m_client.client_secret
  }

  secrets {
    name  = "domain"
    value = var.auth0_domain
  }
}

resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.interactive_account_linking.id
    display_name = auth0_action.interactive_account_linking.name
  }
}