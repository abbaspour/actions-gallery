resource "auth0_action" "block-jit-signup" {
  name    = "block-jit-signup"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/block-jit-signup/block-jit-signup.js")

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
    value = auth0_client.m2m_client_delete_users.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.m2m_client_delete_users.client_secret
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
    id           = auth0_action.block-jit-signup.id
    display_name = auth0_action.block-jit-signup.name
  }
}
*/