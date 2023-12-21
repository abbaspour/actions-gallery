resource "auth0_action" "crm_fetch_customer_id" {
  name    = "Fetch a customer_id from CRM"
  runtime = "node18"
  deploy  = true
  code    = file("../pre-registration/pre-reg-fetch-customer_id.js")

  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }

  dependencies {
    name    = "axios"
    version = "1.6.2"
  }
}

/*
resource "auth0_trigger_actions" "register_deny_list" {
  trigger = "pre-user-registration"

  actions {
    id           = auth0_action.crm_fetch_customer_id.id
    display_name = auth0_action.crm_fetch_customer_id.name
  }
}
*/
