resource "auth0_tenant" "tenant_config" {
  friendly_name = "Actions Gallery Demo"
  flags {
    enable_client_connections = false
  }
}

data "auth0_resource_server" "api_v2" {
  identifier = "https://${var.auth0_domain}/api/v2/"
}


# Users DB
resource "auth0_connection" "users" {
  name     = "Users"
  strategy = "auth0"

  options {
    requires_username      = false
    password_policy        = "low"
    disable_signup         = false
    brute_force_protection = true
  }
}

resource "auth0_connection" "google-social" {
  name     = "google-oauth2"
  strategy = "google-oauth2"

  options {
    client_id = var.google-social-client_id
    client_secret = var.google-social-client_secret
  }
}

resource "auth0_connection" "facebook" {
  name     = "facebook"
  strategy = "facebook"

  options {
  }
}

# simple SPA client
resource "auth0_client" "spa" {
  name            = "JWT.io"
  description     = "Gallery SPA client"
  app_type        = "spa"
  oidc_conformant = true
  is_first_party  = true

  callbacks = [
    "https://jwt.io"
  ]

  allowed_logout_urls = [
  ]

  jwt_configuration {
    alg = "RS256"
  }

  organization_usage = "allow"
}

# Connection vs Clients
resource "auth0_connection_clients" "users_clients" {
  connection_id = auth0_connection.users.id
  enabled_clients = [
    auth0_client.spa.id,
    var.auth0_tf_client_id,
    auth0_client.account-linking-application.id,
    auth0_client.account_linking_companion_app.id
  ]
}

resource "auth0_connection_clients" "google_clients" {
  connection_id = auth0_connection.google-social.id
  enabled_clients = [
    auth0_client.spa.id,
    auth0_client.account_linking_companion_app.id
  ]
}

resource "auth0_connection_clients" "facebook_clients" {
  connection_id = auth0_connection.facebook.id
  enabled_clients = [
    auth0_client.spa.id,
    auth0_client.account_linking_companion_app.id
  ]
}

## Users
resource "auth0_user" "user_1" {
  depends_on = [auth0_connection_clients.users_clients]
  connection_name = auth0_connection.users.name
  email           = "user1@atko.email"
  password        = var.default_password
}

resource "auth0_user" "user_2" {
  depends_on = [auth0_connection_clients.users_clients]
  connection_name = auth0_connection.users.name
  email           = "user2@atko.email"
  password        = var.default_password
}

resource "auth0_user" "user_3" {
  depends_on = [auth0_connection_clients.users_clients]
  connection_name = auth0_connection.users.name
  email           = "a.abbaspour@gmail.com"
  password        = var.default_password
  email_verified  = true
}

## Email Server
/*
// commented in favour of custom email provider action
resource "auth0_email_provider" "mailtrap" {
  name                 = "smtp"
  enabled              = true
  default_from_address = "noreply@actions-gallery.co"
  credentials {
    smtp_host = var.mailtrap_smtp_host
    smtp_port = var.mailtrap_smtp_port
    smtp_user = var.mailtrap_smtp_user
    smtp_pass = var.mailtrap_smtp_pass
  }
}
*/

## SMS gateway
/*
resource "auth0_connection" "sms" {
  name     = "sms"
  strategy = "sms"

  options {
    disable_signup         = false
    name                   = "sms"
    from                   = "+15555555555"
    syntax                 = "md_with_macros"
    template               = "Your one-time password is @@password@@"
    brute_force_protection = true
    provider               = "sms_gateway"
    gateway_url            = var.slack_webhook_url
    forward_request_info   = true

    totp {
      time_step = 300
      length    = 6
    }
  }
}
*/

## outputs
output "spa_client_id" {
  value = auth0_client.spa.client_id
}

output "spa_login_url" {
  value = join("&", [
    "https://${var.auth0_domain}/authorize?client_id=${auth0_client.spa.id}",
    "response_type=id_token",
    "redirect_uri=${urlencode(auth0_client.spa.callbacks[0])}",
    "login_hint=${urlencode(auth0_user.user_1.email)}",
    "scope=${urlencode("openid profile email")}",
    "nonce=n1",
    "state=s1",
  ]
  )
}

