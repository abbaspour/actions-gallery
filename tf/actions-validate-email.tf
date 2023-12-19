resource "auth0_action" "validate_email" {
  name    = "Interactive OTP Email Validation post login"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/validate-email/validate-email.js")

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
    value = auth0_client.m2m_client_update_users.client_id
  }

  secrets {
    name  = "clientSecret"
    value = data.auth0_client.m2m_client_update_users.client_secret
  }

  secrets {
    name  = "domain"
    value = var.auth0_domain
  }
}

resource "auth0_trigger_actions" "validate_email" {
  trigger = "post-login"

  actions {
    id           = auth0_action.validate_email.id
    display_name = auth0_action.validate_email.name
  }
}
