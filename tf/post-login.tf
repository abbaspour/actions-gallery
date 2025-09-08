resource "auth0_trigger_actions" "post-login" {
  trigger = "post-login"

  actions {
    id           = auth0_action.render_privacy_policy_form-action.id
    display_name = auth0_action.render_privacy_policy_form-action.name
  }

  /*
  actions {
    id           = auth0_action.typescript.id
    display_name = auth0_action.typescript.name
  }
  */
}
