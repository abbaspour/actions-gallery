resource "auth0_action" "cache-access_token" {
  name    = "cache access_token"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/cache-access_token/cache-access_token.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  dependencies {
    name    = "auth0"
    version = "4.10.0"
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



resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.cache-access_token.id
    display_name = auth0_action.cache-access_token.name
  }
}
