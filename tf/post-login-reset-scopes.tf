resource "auth0_resource_server" "my-rs" {
  identifier = "my.rs"
  name = "my.rs"
}

resource "auth0_resource_server_scopes" "my-rs-scopes" {
  resource_server_identifier = auth0_resource_server.my-rs.identifier
  scopes {
    name = "s1"
  }
  scopes {
    name = "s2"
  }
  scopes {
    name = "s3"
  }
}

resource "auth0_action" "reset-scopes" {
  name    = "Reset requested scopes and populate with predefines scopes"
  runtime = "node18"
  deploy  = true
  code = file("../post-login/reset-scopes/reset-scopes.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

}


resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.reset-scopes.id
    display_name = auth0_action.reset-scopes.name
  }
}


## outputs
output "spa_login_url_my_rs" {
  value = join("&", [
    "https://${var.auth0_domain}/authorize?client_id=${auth0_client.spa.id}",
    "response_type=token",
    "redirect_uri=${urlencode(auth0_client.spa.callbacks[0])}",
    "login_hint=${urlencode(auth0_user.user_1.email)}",
    "audience=${urlencode(auth0_resource_server.my-rs.identifier)}",
    "scope=${urlencode("s1 s2 s3")}"
  ]
  )
}

