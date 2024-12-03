resource "auth0_action" "register_client_deny_list" {
  name    = "Deny list of clients for user registration"
  runtime = "node18"
  deploy  = true
  code    = file("../pre-registration/pre-reg-client-deny-list.js")

  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }
}


resource "auth0_trigger_actions" "pre-user-registration" {
  trigger = "pre-user-registration"

  actions {
    id           = auth0_action.register_client_deny_list.id
    display_name = auth0_action.register_client_deny_list.name
  }
}

