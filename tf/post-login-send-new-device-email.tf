data "local_file" "new_device_email_template" {
  filename = "../post-login/new-device-login-notify-user/new-device-email-template.html"
}

resource "auth0_action" "new_device_login_notify_user" {
  name    = "Notify User by Email on New Device Login"
  runtime = "node18"
  deploy  = true
  code    = templatefile("../post-login/new-device-login-notify-user/send-email-on-new-device-login.js", {
    EMAIL_TEMPLATE = data.local_file.new_device_email_template.content
  })

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  /*
  dependencies {
    name    = "@sendgrid/mail"
    version = "8.1.0"
  }
  */

  dependencies {
    name    = "nodemailer"
    version = "6.9.7"
  }

  dependencies {
    name    = "liquid"
    version = "5.1.1"
  }

  secrets {
    name  = "SMTP_HOST"
    value = var.mailtrap_smtp_user
  }

  secrets {
    name  = "SMTP_PORT"
    value = var.mailtrap_smtp_port
  }

  secrets {
    name  = "SMTP_USER"
    value = var.mailtrap_smtp_user
  }

  secrets {
    name  = "SMTP_PASS"
    value = var.mailtrap_smtp_pass
  }
}

/*
resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.new_device_login_notify_user.id
    display_name = auth0_action.new_device_login_notify_user.name
  }
}
*/