resource "auth0_action" "dump-context" {
  name    = "Log event object"
  runtime = "node22"
  deploy  = true
  code = file("${path.module}/../post-login/dump-context/post-login-dump-context.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  dependencies {
    name    = "actions:logger"
    version = "1"
  }
}
