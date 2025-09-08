resource "auth0_action" "typescript" {
  name    = "Action Developed in TypeScript"
  runtime = "node22"
  deploy  = true
  code    = file("../dist/post-login-typescript.js")  # npm run build

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  secrets {
    name  = "MY_SECRET"
    value = "typescript-works"
  }
}

