resource "auth0_action" "airtable_create_user" {
  name    = "Create Airtable User on Pre-Registration"
  runtime = "node22"
  deploy  = true
  code    = file("../pre-registration/pre-reg-airtable-create-user.js")

  supported_triggers {
    id      = "pre-user-registration"
    version = "v2"
  }

  # Secrets for Airtable PAT auth and target base/table
  secrets {
    name  = "PERSONAL_ACCESS_TOKEN"
    value = var.airtable_personal_access_token
  }

  secrets {
    name  = "BASE_ID"
    value = var.airtable_base_id
  }

  secrets {
    name  = "TABLE_ID"
    value = var.airtable_users_table_id
  }

  # Action-specific dependency for Airtable SDK
  dependencies {
    name    = "airtable"
    version = "0.12.2"
  }
}
