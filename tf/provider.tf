terraform {
  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 1.57"
    }
    local = {
      source = "hashicorp/local"
      version = "~> 2.9"
    }
    jq = {
      source  = "massdriver-cloud/jq"
      version = "~> 0.2"
    }
  }
}

provider "auth0" {
  domain        = var.auth0_domain
  client_id     = var.auth0_tf_client_id
  client_secret = var.auth0_tf_client_secret
  debug         = "true"
}

