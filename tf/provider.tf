terraform {
  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.1"
    }
    local = {
      source = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

provider "auth0" {
  domain        = var.auth0_domain
  client_id     = var.auth0_tf_client_id
  client_secret = var.auth0_tf_client_secret
  debug         = "true"
}

