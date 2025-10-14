# Load the privacy policy form and its embedded flow from exported JSON
locals {
  secondary_email_otp_verification_form        = "${path.module}/../forms/secondary_email_otp_verification.json"
  flow_secondary_email_otp_verification_start  = jsondecode(file(local.secondary_email_otp_verification_form))["flows"]["#FLOW-1#"]
  flow_secondary_email_otp_verification_verify = jsondecode(file(local.secondary_email_otp_verification_form))["flows"]["#FLOW-2#"]
  form_secondary_email_otp_verification        = jsondecode(file(local.secondary_email_otp_verification_form))["form"]
}


resource "auth0_connection" "passwordless-email" {
  name     = "email"
  strategy = "email"
}

resource "auth0_client" "verify-pwdless-otp" {
  name        = "verify-pwdless-otp"
  description = "verify-pwdless-otp companion app"
  app_type    = "regular_web"

  grant_types = [
    "http://auth0.com/oauth/grant-type/passwordless/otp",
    "client_credentials", # to satisfy Auth0 VC
  ]
}

resource "auth0_client_grant" "verify-pwdless-otp-cc" {
  audience     = data.auth0_resource_server.api_v2.identifier
  client_id    = auth0_client.verify-pwdless-otp.client_id
  subject_type = "client"
  scopes       = ["update:users_app_metadata", "update:users", "read:users"]
}

data "auth0_client" "verify-pwdless-otp" {
  name = auth0_client.verify-pwdless-otp.name
}

resource "auth0_flow_vault_connection" "Validate-Secondary-EmailPhone" {
  app_id       = "AUTH0"
  name         = "Validate-Secondary-Email-Phone"
  account_name = var.auth0_domain

  setup = {
    client_id     = auth0_client.verify-pwdless-otp.client_id
    client_secret = data.auth0_client.verify-pwdless-otp.client_secret
    domain        = var.auth0_domain
    type          = "OAUTH_APP"
    audience      = data.auth0_resource_server.api_v2.identifier
  }
}


resource "auth0_flow" "secondary_email_start" {
  name = "Secondary Email Passwordless Start from TF"
  actions = replace(
    jsonencode(local.flow_secondary_email_otp_verification_start["actions"]),
    "#CONN-1#", auth0_flow_vault_connection.Validate-Secondary-EmailPhone.id
  )
}

resource "auth0_flow" "secondary_email_verify" {
  name = "Secondary Email Passwordless Verify from TF"
  actions = replace(
    jsonencode(local.flow_secondary_email_otp_verification_verify["actions"]),
    "#CONN-1#", auth0_flow_vault_connection.Validate-Secondary-EmailPhone.id
  )
}

resource "auth0_form" "secondary_email" {
  name = "Secondary Email From from TF"
  languages {
    primary = "en"
  }
  start  = jsonencode(local.form_secondary_email_otp_verification["start"])
  ending = jsonencode(local.form_secondary_email_otp_verification["ending"])
  nodes = replace(
    replace(
      jsonencode(local.form_secondary_email_otp_verification["nodes"]),
    "#FLOW-1#", auth0_flow.secondary_email_start.id),
  "#FLOW-2#", auth0_flow.secondary_email_verify.id)

}


# Create the action
data "local_file" "secondary_email_form_code" {
  filename = "${path.module}/../post-login/forms-secondary-email/render-secondary-email-form.js"
}

resource "auth0_action" "render_secondary_email_form-action" {
  name   = "render-secondary-email-form"
  code   = data.local_file.secondary_email_form_code.content
  deploy = true

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  secrets {
    name  = "SECONDARY_EMAIL_FORM_ID"
    value = auth0_form.secondary_email.id
  }

  secrets {
    name  = "client_id"
    value = auth0_client.verify-pwdless-otp.client_id
  }

  secrets {
    name  = "client_secret"
    value = data.auth0_client.verify-pwdless-otp.client_secret
  }

}
