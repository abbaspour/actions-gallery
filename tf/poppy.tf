# pre-reg: tenant {
#  default_audience = auth0_resource_server.shop.identifier
#  resource_parameter_profile = "compatibility"
#  authorization_response_iss_parameter_supported = true
#}

# add poppy domains: https://github.com/abbaspour/auth0-bash/blob/master/tenant/set-poppy-company-domains.sh

resource "auth0_client_cimd" "poppy-agent" {
  external_client_id = "https://agent.abbaspour.net/cimd.json" # cf tunnel must be running. see poppy-bash/readme.md

}

resource "auth0_resource_server" "shop" {
  identifier = "https://shop.abbaspour.net"
  name       = "shop"

  allow_offline_access                            = true
  skip_consent_for_verifiable_first_party_clients = true

  subject_type_authorization {
    anonymous_user {
      #policy = "require_client_grant"
    }
    user {
      policy = "allow_all"
    }
  }

  # enable a domain level connection https://github.com/abbaspour/auth0-bash/blob/master/connections/mark-domain-level.sh

  # next https://github.com/abbaspour/auth0-bash/blob/master/resource-server/enable-poppy-access.sh
}

resource "auth0_client_grant" "shop-3p-grant" {
  default_for      = "third_party_clients"
  audience         = auth0_resource_server.shop.identifier
  subject_type     = "user"
  allow_all_scopes = true
}

# https://shop.abbaspour.net/openapi.json
resource "auth0_resource_server_scopes" "shop" {
  resource_server_identifier = auth0_resource_server.shop.identifier

  scopes {
    name        = "poppy:browser-sign-in"
    description = "Use the website on your behalf, with the permissions you approve"
  }

  scopes {
    name        = "orders:read"
    description = "orders:read"
  }

  scopes {
    name        = "orders:write"
    description = "orders:write"
  }
}

resource "auth0_client" "shop-rwa" {
  name = "Shop RWA"

  description     = "Web app for shop testing with poppy"
  app_type        = "regular_web"
  oidc_conformant = true
  is_first_party  = true

  callbacks = [
    "https://shop.abbaspour.net/cb"
  ]

  allowed_logout_urls = [
  ]

  jwt_configuration {
    alg = "RS256"
  }

  agent_id = auth0_agent.popp-agent.id # missing in CIMD client

  # next: https://github.com/abbaspour/auth0-bash/blob/master/clients/enable-poppy-browser-join.sh
}

output "shop-rwa-client-id" {
  value = auth0_client.shop-rwa.client_id
}

output "shop-browser-join-url" {
  value = "https://shop-auth.abbaspour.net/poppy/${auth0_client.shop-rwa.client_id}/browser-session"
}

resource "auth0_agent" "popp-agent" {
  name = "poppy-agent"

}
