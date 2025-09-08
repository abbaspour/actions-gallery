# M2M update:users
resource "auth0_client" "m2m_client_update_users" {
  name  = "m2m client with update:users"
  app_type = "non_interactive"
  grant_types = [
    "client_credentials"
  ]
}

data "auth0_client" "m2m_client_update_users" {
  name = auth0_client.m2m_client_update_users.name
  client_id = auth0_client.m2m_client_update_users.client_id
}

resource "auth0_client_grant" "m2m_client_update_users_scopes" {
  client_id = auth0_client.m2m_client_update_users.client_id
  audience = data.auth0_resource_server.api_v2.identifier
  scopes = ["update:users"]
  subject_type = "client"
}

# M2M update and search/read users
resource "auth0_client" "m2m_client_update_read_users" {
  name  = "m2m client with users read, update"
  app_type = "non_interactive"
  grant_types = [
    "client_credentials"
  ]
}

data "auth0_client" "m2m_client_update_read_users" {
  name = auth0_client.m2m_client_update_read_users.name
  client_id = auth0_client.m2m_client_update_read_users.client_id
}

resource "auth0_client_grant" "m2m_client_update_read_users_scopes" {
  client_id = auth0_client.m2m_client_update_read_users.client_id
  audience = data.auth0_resource_server.api_v2.identifier
  scopes = ["update:users", "read:users"]
  subject_type = "client"
}

# M2M delete users
resource "auth0_client" "m2m_client_delete_users" {
  name  = "m2m client with delete:users"
  app_type = "non_interactive"
  grant_types = [
    "client_credentials"
  ]
}

data "auth0_client" "m2m_client_delete_users" {
  name = auth0_client.m2m_client_delete_users.name
  client_id = auth0_client.m2m_client_delete_users.client_id
}

resource "auth0_client_grant" "m2m_client_delete_users_scopes" {
  client_id = auth0_client.m2m_client_delete_users.client_id
  audience = data.auth0_resource_server.api_v2.identifier
  scopes = ["delete:users"]
  subject_type = "client"
}

