resource "auth0_trigger_actions" "post-login" {
  trigger = "post-login"

  actions {
    id           = auth0_action.dump-context.id
    display_name = auth0_action.dump-context.name
  }

  actions {
    id           = auth0_action.render-kyc-action.id
    display_name = auth0_action.render-kyc-action.name
  }

  /*
  actions {
    id           = auth0_action.secondary_email_mfa-action.id
    display_name = auth0_action.secondary_email_mfa-action.name
  }
  */

  /*
  actions {
    id           = auth0_action.render_secondary_email_form-action.id
    display_name = auth0_action.render_secondary_email_form-action.name
  }
  */

  /*
  actions {
    id           = auth0_action.render_privacy_policy_form-action.id
    display_name = auth0_action.render_privacy_policy_form-action.name
  }
  */
  /*
  actions {
    id           = auth0_action.typescript.id
    display_name = auth0_action.typescript.name
  }
  */

  # must stay last so it sees scopes set by other actions
  actions {
    id           = auth0_action.poppy-offline-access.id
    display_name = auth0_action.poppy-offline-access.name
  }
}
