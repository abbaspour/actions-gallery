resource "auth0_action" "hubspot_create_contact" {
  name    = "Create HubSpot Contact on Pre-Registration"
  runtime = "node22"
  deploy  = true
  code    = file("../pre-registration/pre-reg-hubspot-create-contact.js")

  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }

  secrets {
    name      = "HUBSPOT_PRIVATE_APP_ACCESS_TOKEN"
    value     = var.hubspot_private_app_access_token
  }

  # Add HubSpot SDK dependency specifically to this action bundle
  dependencies {
    name    = "@hubspot/api-client"
    # Use a wide constraint to allow newer, compatible versions
    version = "13.1.0"
  }
}

