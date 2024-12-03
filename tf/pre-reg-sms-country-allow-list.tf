resource "auth0_action" "sms_country_allow_list" {
  name    = "Allow list of Countries for SMS Passwordless registration"
  runtime = "node18"
  deploy  = true
  code    = file("../pre-registration/pre-reg-sms-country-allow-list.js")

  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }

  dependencies {
    name    = "awesome-phonenumber"
    version = "6.2.0"
  }

}

/*
resource "auth0_trigger_actions" "pre-user-registration" {
  trigger = "pre-user-registration"

  actions {
    id           = auth0_action.sms_country_allow_list.id
    display_name = auth0_action.sms_country_allow_list.name
  }
}
*/