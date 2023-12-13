resource "auth0_action" "session_count" {
  name    = "Count and limit session per user"
  runtime = "node18"
  deploy  = true
  code    = file("../post-login/session-count/limit-session-count.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  dependencies {
    name    = "ioredis"
    version = "5.3.2"
  }

  secrets {
    name  = "REDIS_URL"
    value = var.redis_endpoint
  }

  secrets {
    name  = "REDIS_PASSWORD"
    value = var.redis_password
  }

  secrets {
    name  = "SESSION_LIFETIME"
    value = "3600"
    //value = auth0_tenant.tenant_config.session_lifetime
  }

  secrets {
    name  = "MAX_SESSION"
    value = 3
  }
}


resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.session_count.id
    display_name = auth0_action.session_count.name
  }
}
