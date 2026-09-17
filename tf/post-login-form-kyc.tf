# Load the kyc_collection form and its embedded flow from exported JSON
locals {
  kyc_collection      = "${path.module}/../forms/kyc-collection.json"
  flow_kyc_collection = jsondecode(file(local.kyc_collection))["flows"]["#FLOW-1#"]
  form_kyc_collection = jsondecode(file(local.kyc_collection))["form"]

}

# Flow Vault Connection for Post-Login Privacy Policy Form
# This connection allows the action to fetch data using an M2M client with read/update users permissions.
resource "auth0_flow_vault_connection" "post_login_kyc_form-vc" {
  app_id       = "AUTH0"
  name         = "post-login-kyc-form-vc"
  account_name = var.auth0_domain

  setup = {
    client_id     = auth0_client.m2m_client_update_read_users.client_id
    client_secret = data.auth0_client.m2m_client_update_read_users.client_secret
    domain        = var.auth0_domain
    type          = "OAUTH_APP"
  }
}

resource "auth0_flow" "kyc_update_metadata" {
  name = "Update KYC Metadata from TF"
  actions = replace(
    jsonencode(local.flow_kyc_collection["actions"]),
    "#CONN-1#", auth0_flow_vault_connection.post_login_kyc_form-vc.id
  )
}

resource "auth0_form" "kyc-collection" {
  name = "KYC collection from TF"
  languages {
    primary = "en"
  }
  start  = jsonencode(local.form_kyc_collection["start"])
  ending = jsonencode(local.form_kyc_collection["ending"])
  nodes  = replace(jsonencode(local.form_kyc_collection["nodes"]), "#FLOW-1#", auth0_flow.kyc_update_metadata.id)
}

# Create the action
data "local_file" "kyc_form_code" {
  filename = "${path.module}/../post-login/forms-kyc/render-kyc-when-missing.js"
}

resource "auth0_action" "render-kyc-action" {
  name   = "render-kyc-when-missing"
  code   = data.local_file.kyc_form_code.content
  deploy = true

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  secrets {
    name  = "KYC_FORM_ID"
    value = auth0_form.kyc-collection.id
  }

}
