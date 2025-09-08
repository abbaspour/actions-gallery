resource "auth0_client" "account-linking-application" {
  name            = "Account Linking Application"
  oidc_conformant = true
  app_type        = "regular_web"

  grant_types = [
    "client_credentials", "authorization_code",
  ]

  jwt_configuration {
    alg = "RS256"
  }

  callbacks = [
    "https://${var.auth0_domain}/continue"
  ]
}

resource "auth0_client_grant" "account-linking-application_update_users_scopes" {
  client_id = auth0_client.account-linking-application.client_id
  audience  = data.auth0_resource_server.api_v2.identifier
  scopes = ["update:users"]
  subject_type = "client"
}

data "auth0_client" "account-linking-application" {
  name      = auth0_client.account-linking-application.name
  client_id = auth0_client.account-linking-application.client_id
}

resource "auth0_action" "interactive_account_linking" {
  name    = "Interactive Account Linking Nested Transaction"
  runtime = "node18"
  deploy  = true
  code = file("../post-login/account-linking/interactive-account-linking.js")

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
    value = auth0_client.account-linking-application.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.account-linking-application.client_secret
  }

  secrets {
    name  = "domain"
    value = var.auth0_domain
  }

  secrets {
    name  = "database"
    value = auth0_connection.users.name
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