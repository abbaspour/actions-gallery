resource "auth0_action" "silent_account_linking" {
  name    = "Silent Account Linking"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/silent-account-linking/silent-account-linking.js")

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
    value = auth0_client.m2m_client_update_read_users.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.m2m_client_update_read_users.client_secret
  }

  secrets {
    name  = "domain"
    value = var.auth0_domain
  }
}

/*
resource "auth0_trigger_actions" "silent_linking_trigger" {
  trigger = "post-login"

  actions {
    id           = auth0_action.silent_account_linking.id
    display_name = auth0_action.silent_account_linking.name
  }
}
*/
