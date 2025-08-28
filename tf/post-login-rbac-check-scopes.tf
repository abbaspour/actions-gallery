resource "auth0_resource_server" "auspost" {
  identifier = "auspost"
  name = "auspost"
  enforce_policies = true
  #token_dialect = "access_token"
  token_dialect = "access_token_authz"
}

resource "auth0_resource_server_scopes" "auspost-scopes" {
  resource_server_identifier = auth0_resource_server.auspost.identifier

  scopes {
    name = "r1"
  }
  scopes {
    name = "r2"
  }
  scopes {
    name = "r3"
  }
}

resource "auth0_role" "auspost" {
  name = "auspost"
}

resource "auth0_role_permissions" "auspost-role-perms" {
  role_id = auth0_role.auspost.id

  permissions {
    name                       = "r1"
    resource_server_identifier = auth0_resource_server.auspost.identifier
  }
  permissions {
    name                       = "r2"
    resource_server_identifier = auth0_resource_server.auspost.identifier
  }
}

resource "auth0_action" "rbac-check-scopes" {
  name    = "rbac-check-scopes"
  runtime = "node22"
  deploy  = true
  code = file("../post-login/rbac/rbac-check-scopes.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

}

/*
resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.rbac-check-scopes.id
    display_name = auth0_action.rbac-check-scopes.name
  }
}
*/