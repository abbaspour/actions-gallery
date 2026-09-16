resource "auth0_action" "post-identifier" {
  name    = "post-identifier"
  runtime = "node22"
  deploy  = true
  code    = file("${path.module}/../post-identifier/post-identifier.js")

  supported_triggers {
    id      = "login-post-identifier"
    version = "v1"
  }

}

/*
resource "auth0_trigger_actions" "post-identifier" {
  trigger = "login-post-identifier"

  actions {
    id           = auth0_action.post-identifier.id
    display_name = auth0_action.post-identifier.name
  }
}
*/