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
    value = "ap_7c2g5bN9X238co2M1iWtqA" //auth0_form.secondary_email.id
  }

}
