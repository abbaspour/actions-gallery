resource "auth0_client" "account_linking_companion_app" {
  name        = "Accoubt linking companion client"
  description = "RWA client for nexted TX and API2"

  app_type                              = "regular_web"
  oidc_conformant                       = true
  is_first_party                        = true

  grant_types = [
    "client_credentials", "authorization_code",
  ]

  callbacks = [
    "https://${var.auth0_domain}/continue"
  ]

  allowed_logout_urls = [
  ]

  jwt_configuration {
    alg = "RS256"
  }
}

resource "auth0_client_grant" "client-initiated-account-linking-application_update_users_scopes" {
  client_id = auth0_client.account_linking_companion_app.client_id
  audience  = data.auth0_resource_server.api_v2.identifier
  scopes = ["update:users"]
}

resource "auth0_action" "account_linking" {
  name    = "Client Initiated Account Linking"
  runtime = "node22"
  deploy  = true
  code = file("../post-login/client-initiated-account-linking/client-initiated-account-linking.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  dependencies {
    name    = "auth0"
    version = "4.1.0"
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

  secrets {
    name  = "domain"
    value = var.auth0_domain
  }

  secrets {
    name  = "clientId"
    value = auth0_client.account_linking_companion_app.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.account_linking_companion_app.client_secret
  }
}

data "auth0_client" "account_linking_companion_app" {
  client_id = auth0_client.account_linking_companion_app.client_id
}

resource "auth0_trigger_actions" "account_account_linking_trigger" {
  trigger = "post-login"

  actions {
    id           = auth0_action.account_linking.id
    display_name = auth0_action.account_linking.name
  }
}


output "par_linking_companion_app_id" {
  value = auth0_client.account_linking_companion_app.client_id
}

resource "auth0_resource_server" "my-account" {
  name       = "My Accounts API"
  identifier = "my-account"

  skip_consent_for_verifiable_first_party_clients = true
  allow_offline_access                            = false
  signing_alg                                     = "RS256"
  consent_policy                                  = "null"
}

resource "auth0_resource_server_scopes" "my-account" {
  resource_server_identifier = auth0_resource_server.my-account.identifier

  scopes {
    name        = "link_account"
    description = "link_account"
  }

  scopes {
    name        = "unlink_account"
    description = "unlink_account"
  }
}


