# Load the privacy policy form JSON
locals {
  privacy_policy_form = file("${path.module}/../forms/privacy-policy.json")
}

data "jq_query" "privacy_policy_form-start" {
  data = local.privacy_policy_form
  query = ".form.start"
}

data "jq_query" "privacy_policy_form-nodes" {
  data = local.privacy_policy_form
  query = ".form.nodes"
}

data "jq_query" "privacy_policy_form-ending" {
  data = local.privacy_policy_form
  query = ".form.ending"
}

data "jq_query" "privacy_policy_form-flow1" {
  data = local.privacy_policy_form
  query = ".flows[\"#FLOW-1#\"].actions"
}

# Create the form
/*
resource "auth0_form" "privacy_policy" {
  name = "Privacy Policy Form"
  start = data.jq_query.privacy_policy_form-start.result
  ending = data.jq_query.privacy_policy_form-ending.result
  nodes = data.jq_query.privacy_policy_form-nodes.result
}
*/

# Load the action code
data "local_file" "render_privacy_policy_form_code" {
  filename = "${path.module}/../post-login/forms/render-privacy-policy-form.js"
}

# Create the action
resource "auth0_action" "render_privacy_policy_form-action" {
  name    = "render-privacy-policy-form"
  code    = data.local_file.render_privacy_policy_form_code.content
  deploy = true

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  secrets {
    name  = "PRIVACY_POLICY_FORM_ID"
    //value = auth0_form.privacy_policy.id
    value = "ap_14JHqdKoQkUmsnsvjfGB8m"
  }

}

/*
resource "auth0_flow" "update_metadata_flow" {
  name = "update_metadata_flow"
  actions = data.jq_query.privacy_policy_form-flow1.result
}
*/

# Output the action and form IDs
/*
output "privacy_policy_form_id" {
  description = "The ID of the privacy policy form"
  value       = auth0_form.privacy_policy.id
}
*/

# Flow Vault Connection for Post-Login Privacy Policy Form
# This connection allows the action to fetch data using an M2M client
# with read/update users permissions.
resource "auth0_flow_vault_connection" "post_login_privacy_policy_form-vc" {
  app_id = "AUTH0"
  name   = "post-login-privacy-policy-form-vc"
  account_name = var.auth0_domain

  setup = {
    client_id     = auth0_client.m2m_client_update_read_users.client_id
    client_secret = data.auth0_client.m2m_client_update_read_users.client_secret
    domain        = var.auth0_domain
    type          = "OAUTH_APP"
  }
}

