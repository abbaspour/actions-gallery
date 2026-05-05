resource "auth0_action" "dump-context" {
  name    = "Log event object"
  runtime = "node22"
  deploy  = true
  code = file("${path.module}/../post-login/dump-context/post-login-dump-context.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  modules {
    module_id             = auth0_action_module.logger.id
    module_version_id     = data.auth0_action_module_versions.logger_module_versions.versions[0].id
  }
}
