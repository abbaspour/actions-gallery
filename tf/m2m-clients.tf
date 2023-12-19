# update:users
resource "auth0_client" "m2m_client_update_users" {
  name  = "m2m client with update:users"
  app_type = "non_interactive"
  grant_types = [
    "client_credentials"
  ]
}

data "auth0_client" "m2m_client_update_users" {
  depends_on = [auth0_client.m2m_client_update_users]
  name = "M2M Account Linking"
  client_id = auth0_client.m2m_client_update_users.client_id
}

resource "auth0_client_grant" "m2m_client_update_users_scopes" {
  client_id = auth0_client.m2m_client_update_users.client_id
  audience = data.auth0_resource_server.api_v2.identifier
  scopes = ["update:users"]
}

