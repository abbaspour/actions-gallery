
resource "auth0_phone_provider" "custom_phone_provider" {

  name                 = "custom"

  disabled              = false

  configuration {
    delivery_methods = ["text"]
  }

  credentials {}
  
  depends_on = [
    auth0_action.sms_to_slack
  ]
}

resource "auth0_action" "sms_to_slack" {
  name    = "SMS to Slack"
  runtime = "node22"
  deploy  = true
  code = file("../custom-phone-provider/sms-to-slack.js")

  supported_triggers {
    id      = "custom-phone-provider"
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
