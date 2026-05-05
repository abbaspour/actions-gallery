resource "auth0_action_module" "logger" {
  name = "logger"
  code = file("${path.module}/../modules/minimal-log.js")
  publish = true
}

data "auth0_action_module_versions" "logger_module_versions" {
  module_id = auth0_action_module.logger.id
}