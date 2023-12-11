resource "auth0_client" "silent_linking_m2m_client" {
  name  = "M2M Silent Account Linking"
  app_type = "non_interactive"
  grant_types = [
    "client_credentials"
  ]
}

data "auth0_client" "silent_linking_client" {
  depends_on = [auth0_client.silent_linking_m2m_client]
  name = "M2M Silent Account Linking"
  client_id = auth0_client.silent_linking_m2m_client.client_id
}

resource "auth0_client_grant" "silent_linking_client_scopes" {
  client_id = auth0_client.silent_linking_m2m_client.client_id
  audience = data.auth0_resource_server.api_v2.identifier
  scopes = ["update:users", "read:users"]
}

resource "auth0_action" "silent_account_linking" {
  name    = "Silent Account Linking"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/account-linking/silent-account-linking.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  dependencies {
    name    = "auth0"
    version = "4.1.0"
  }

  secrets {
    name  = "clientId"
    value = auth0_client.silent_linking_m2m_client.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.silent_linking_client.client_secret
  }

  secrets {
    name  = "domain"
    value = var.auth0_domain
  }
}

resource "auth0_trigger_actions" "silent_linking_trigger" {
  trigger = "post-login"

  actions {
    id           = auth0_action.silent_account_linking.id
    display_name = auth0_action.silent_account_linking.name
  }
}