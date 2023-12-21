resource "auth0_action" "register_deny_list" {
  name    = "Maintain a Deny list for allowed Domains to Register"
  runtime = "node18"
  deploy  = true
  code    = file("../pre-registration/pre-reg-domain-deny-list.js")

  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }

}

resource "auth0_trigger_actions" "register_deny_list" {
  trigger = "pre-user-registration"

  actions {
    id           = auth0_action.register_deny_list.id
    display_name = auth0_action.register_deny_list.name
  }
}
