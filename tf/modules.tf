resource "auth0_action_module" "log" {
  name = "logger"
  code = file("${path.module}/../modules/minimal-log.js")
}