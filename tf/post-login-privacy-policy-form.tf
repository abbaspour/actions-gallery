# Load the privacy policy form and its embedded flow from exported JSON
locals {
  flow_update_metadata          = jsondecode(file("${path.module}/../forms/privacy-policy.json"))["flows"]["#FLOW-1#"]
  form_privacy_policy          = jsondecode(file("${path.module}/../forms/privacy-policy.json"))["form"]
}

# Flow Vault Connection for Post-Login Privacy Policy Form
# This connection allows the action to fetch data using an M2M client with read/update users permissions.
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

resource "auth0_flow" "update_metadata" {
  name = "Udpdate Metadata from TF"
  actions = replace(
    jsonencode(local.flow_update_metadata["actions"]),
    "#CONN-1#", auth0_flow_vault_connection.post_login_privacy_policy_form-vc.id
  )
}

resource "auth0_form" "privacy_policy" {
  name = "Privacy Policy from TF"
  languages {
    primary = "en"
  }
  start  = jsonencode(local.form_privacy_policy["start"])
  ending = jsonencode(local.form_privacy_policy["ending"])
  nodes = replace(jsonencode(local.form_privacy_policy["nodes"]), "#FLOW-1#", auth0_flow.update_metadata.id)
}

# Create the action
data "local_file" "render_privacy_policy_form_code" {
  filename = "${path.module}/../post-login/forms/render-privacy-policy-form.js"
}

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
    value = auth0_form.privacy_policy.id
  }

}

