resource "auth0_action" "tx_metadata_1" {
  name    = "Writes to transaction metadata"
  runtime = "node22"
  deploy  = true
  code    = file("../post-login/transaction-metadata/post-login-tx-metadata-action1-writer.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
}

resource "auth0_action" "tx_metadata_2" {
  name    = "Reads from transaction metadata"
  runtime = "node22"
  deploy  = true
  code    = file("../post-login/transaction-metadata/post-login-tx-metadata-action2-reader.js")

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
}



resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.tx_metadata_1.id
    display_name = auth0_action.tx_metadata_1.name
  }

  actions {
    id           = auth0_action.tx_metadata_2.id
    display_name = auth0_action.tx_metadata_2.name
  }
}

