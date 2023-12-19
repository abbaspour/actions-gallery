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
  name = "Users"
  strategy = "auth0"

  options {
    requires_username = false
    password_policy = "low"
    disable_signup = false
    brute_force_protection = true
  }
}

resource "auth0_connection" "google" {
  name = "google-oauth2"
  strategy = "google-oauth2"

  options {
  }
}

resource "auth0_connection" "facebook" {
  name = "facebook"
  strategy = "facebook"

  options {
  }
}

# simple SPA client
resource "auth0_client" "spa" {
  name = "SPA"
  description = "Gallery SPA client"
  app_type = "spa"
  oidc_conformant = true
  is_first_party = true

  callbacks = [
    "https://jwt.io",
    "https://${var.auth0_domain}/continue"
  ]

  allowed_logout_urls = [
  ]

  jwt_configuration {
    alg = "RS256"
  }
}

# Connection vs Clients
resource "auth0_connection_clients" "users_clients" {
  connection_id   = auth0_connection.users.id
  enabled_clients = [auth0_client.spa.id, var.auth0_tf_client_id]
}

resource "auth0_connection_clients" "google_clients" {
  connection_id   = auth0_connection.google.id
  enabled_clients = [auth0_client.spa.id]
}

resource "auth0_connection_clients" "facebook_clients" {
  connection_id   = auth0_connection.facebook.id
  enabled_clients = [auth0_client.spa.id]
}

## Users
resource "auth0_user" "user_1" {
  depends_on = [auth0_connection_clients.users_clients]
  connection_name = auth0_connection.users.name
  email = "user1@atko.email"
  password = var.default_password
}

resource "auth0_user" "user_2" {
  depends_on = [auth0_connection_clients.users_clients]
  connection_name = auth0_connection.users.name
  email = "user2@atko.email"
  password = var.default_password
}

resource "auth0_user" "user_3" {
  depends_on = [auth0_connection_clients.users_clients]
  connection_name = auth0_connection.users.name
  email = "a.abbaspour@gmail.com"
  password = var.default_password
  email_verified = true
}

## Email Server
resource "auth0_email_provider" "mailtrap" {
  name = "smtp"
  enabled = true
  default_from_address = "noreply@actions-gallery.co"
  credentials {
    smtp_host = "sandbox.smtp.mailtrap.io"
    smtp_port = 2525
    smtp_user = var.mailtrap_smtp_user
    smtp_pass = var.mailtrap_smtp_pass
  }
}

## outputs
output "spa_login_url" {
  value = "https://${var.auth0_domain}/authorize?client_id=${auth0_client.spa.id}&redirect_uri=https%3A%2F%2Fjwt.io&response_type=id_token&nonce=nonce&prompt=login&scope=openid%20profile%20email&login_hint=abbaspour_amin@yahoo.com"
}

