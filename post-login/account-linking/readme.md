# Interactive Account Linking

## Demo

[![Demo](./demo-screenshot.png)](https://zoom.us/clips/share/CwcvxH7dFgvtfWSHNOxcVMz5h0AHxTSx1s8bNbOaKPBL7pKa_zt__DFQv-cBEJycy6ziBaWHjD2ynWsHZ3WKinYf.dquuHh5vH8Jnuznf)

## Sequence

![interactive account linking seq](./interactive-account-linking.png)

## Terraform Setup

Visit [post-login-interactive-linking.tf](../../tf/post-login-interactive-linking.tf)

## Manual Setup

### Step 1) Add Regular Web "Account Linking Application"
![step-1](./setup/step-1.png)

### Step 2) Set Allowed Callback URL to domain/continue
![step-2](./setup/step-2.png)

### Step 3) Enable CC and AC Grants
![step-3](./setup/step-3.png)

### Step 4) Add API2 scopes
![step-4](./setup/step-4.png)

### Step 5) Enable Connections
![step-5](./setup/step-5.png)

### Step 6) Install Post Login Action
![step-6](./setup/step-6.png)

Source code [interactive-account-linking.js](interactive-account-linking.js)

### Step 7) Configure Secrets
![step-7](./setup/step-7.png)

| Key            | Value                                     |
|----------------|-------------------------------------------|
| `domain`       | your Auth0 domain                         |
| `clientId`     | Account Linking Application Client ID     |
| `clientSecret` | Account Linking Application Client Secret |
| `database`     | Name of Database Connection holding users |

## Silent Account Linking

Visit [silent account linking](../silent-account-linking) for non-interactive linking.
