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

# Output the action and form IDs
/*
output "privacy_policy_form_id" {
  description = "The ID of the privacy policy form"
  value       = auth0_form.privacy_policy.id
}
*/

