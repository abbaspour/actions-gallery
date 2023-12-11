## auth0
variable "auth0_domain" {
  type = string
  description = "Auth0 Domain"
}

variable "auth0_tf_client_id" {
  type = string
  description = "Auth0 TF provider client_id"
}

variable "auth0_tf_client_secret" {
  type = string
  description = "Auth0 TF provider client_secret"
  sensitive = true
}

variable "default_password" {
  type = string
  description = "password for test users"
  sensitive = true
}

## mailtrap
variable "mailtrap_smtp_user" {
  type = string
}

variable "mailtrap_smtp_pass" {
  type = string
  sensitive = true
}