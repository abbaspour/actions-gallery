resource "auth0_email_provider" "custom_email_provider" {
  name                 = "custom"
  enabled              = true
  default_from_address = "accounts@example.com"
  credentials {}
  depends_on = [
    auth0_action.email_to_slack
  ]
}

resource "auth0_action" "email_to_slack" {
  name    = "Email to Slack"
  runtime = "node18"
  deploy  = true
  code = file("../custom-email-provider/email-to-slack.js")

  supported_triggers {
    id      = "custom-email-provider"
    version = "v1"
  }

  dependencies {
    name    = "axios"
    version = "1.7.9"
  }

  secrets {
    name  = "SLACK_WEBHOOK_URL"
    value = var.slack_webhook_url
  }
}