# Revoke User refresh tokens post change password.
## Secrets to create

- AUTH0_DOMAIN
- AUTH0_CLIENT_ID
- AUTH0_CLIENT_SECRET

## Scopes required for AUTH0_CLIENT_ID

Make sure the AUTH0_CLIENT_ID has client_credentials grant. Create it as a Machine To Machine Application

```
read:device_credentials
delete:device_credentials
```