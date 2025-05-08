resource "auth0_action" "limit-org-to-domain" {
  name    = "Limit access to org to certains custom domain(s)"
  runtime = "node18"
  deploy  = true
  code = file("../post-login/multiple-custom-domains/limit-org-to-domain.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
}

resource "auth0_organization" "saas-abc" {
  name         = "abc"
  display_name = "ABC"
  metadata = {
    deny_domains = "ag2.authlab.work"
    allow_domains = "ag1.authlab.work"
  }
}

resource "auth0_organization_connections" "saas-abc-connections" {
  organization_id = auth0_organization.saas-abc.id
  enabled_connections {
    connection_id              = auth0_connection.users.id
    assign_membership_on_login = true
    is_signup_enabled          = true
  }
  enabled_connections {
    connection_id              = auth0_connection.facebook.id
    assign_membership_on_login = true
    show_as_button             = true
  }
  enabled_connections {
    connection_id              = auth0_connection.google-social.id
    assign_membership_on_login = true
    show_as_button             = true
  }
}

resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.limit-org-to-domain.id
    display_name = auth0_action.limit-org-to-domain.name
  }
}

output "saas-abc-org-id" {
  value = auth0_organization.saas-abc.id
}