/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const Liquid = require('liquid');
const EMAIL_SUBJECT = 'New Device Login';
const EMAIL_FROM = 'no-reply@something.com';

exports.onExecutePostLogin = async (event, api) => {
    if (event.authentication &&
        event.authentication.riskAssessment &&
        event.authentication.riskAssessment.assessments.NewDevice) {

        // Example condition: prompt MFA only based on the NewDevice 
        // confidence level, this will prompt for MFA when a user is logging in 
        // from an unknown device.
        let shouldPromptMfa, shouldSendNotification;

        switch (event.authentication.riskAssessment.assessments.NewDevice.confidence) {
            case 'low':
            case 'medium':
                shouldPromptMfa = true;
                shouldSendNotification = true;
                break;
            case 'high':
                shouldPromptMfa = false;
                shouldSendNotification = false;
                break;
            case 'neutral':
                // When this assessor has no useful information about the confidence, 
                // do not prompt MFA.
                shouldPromptMfa = false;
                shouldSendNotification = false;
                break;
        }

        // It only makes sense to prompt for MFA when the user has at least one 
        // enrolled MFA factor.
        const canPromptMfa = event.user.multifactor && event.user.multifactor.length > 0;
        if (shouldSendNotification) {
            try {
                const html = await renderSecurityNotification(event);
                console.log(html);
                //await sendSecurityNotificationSMTP(html);
            } catch (e) {
                console.log(e);
            }

        }
        if (shouldPromptMfa && canPromptMfa) {
            api.multifactor.enable('any', {allowRememberBrowser: true});
        }
    }

    async function renderSecurityNotification(ev) {
        const engine = new Liquid.Engine();
        console.log(ev, event.user);
        // Rebrand this template
        // TODO: inject with Terraform
        // eslint-disable-next-line max-len
        const template = '<html><head><style type="text/css">.ExternalClass, .ExternalClass div, .ExternalClass font, .ExternalClass p, .ExternalClass span, .ExternalClass td, img{ line-height: 100%} #outlook a{ padding: 0} .ExternalClass, .ReadMsgBody{ width: 100%} a, blockquote, body, li, p, table, td{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%} table, td{ mso-table-lspace: 0; mso-table-rspace: 0} img{ -ms-interpolation-mode: bicubic; border: 0; height: auto; outline: 0; text-decoration: none} table{ border-collapse: collapse !important} #bodyCell, #bodyTable, body{ height: 100% !important; margin: 0; padding: 0; font-family: ProximaNova, sans-serif} #bodyCell{ padding: 20px} #bodyTable{ width: 600px} @font-face{ font-family: ProximaNova; src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot); src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.eot?#iefix) format(\'embedded-opentype\'), url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-regular-webfont-webfont.woff) format(\'woff\'); font-weight: 400; font-style: normal} @font-face{ font-family: ProximaNova; src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot); src: url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.eot?#iefix) format(\'embedded-opentype\'), url(https://cdn.auth0.com/fonts/proxima-nova/proximanova-semibold-webfont-webfont.woff) format(\'woff\'); font-weight: 600; font-style: normal} @media only screen and (max-width:480px){ #bodyTable, body{ width: 100% !important} a, blockquote, body, li, p, table, td{ -webkit-text-size-adjust: none !important} body{ min-width: 100% !important} #bodyTable{ max-width: 600px !important} #signIn{ max-width: 280px !important}} </style></head><body><p>&nbsp; </p><center><table id="bodyTable" style="width: 600px; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 0; padding: 0;" border="0" width="100%" cellspacing="0" cellpadding="0" align="center"><tbody><tr><td id="bodyCell" style="-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 0; padding: 20px;" align="center" valign="top"><div class="main"><p style="text-align: center; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; margin-bottom: 30px;"><img style="-ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;" src="https://cdn.auth0.com/styleguide/2.0.9/lib/logos/img/badge.png" alt="Your logo goes here" width="50" /></p><h1>New device signed in to</h1><br /><h1>{{event.user.email}} </h1><table style="border-collapse: collapse; width: 100%; height: 72px;" border="1"><tbody><tr style="height: 18px;"><td style="width: 50%; height: 18px;">IP Address</td><td style="width: 50%; height: 18px;">{{event.request.ip}} </td></tr><tr style="height: 18px;"><td style="width: 50%; height: 18px;">User Agent</td><td style="width: 50%; height: 18px;">{{event.request.user_agent}} </td></tr><tr style="height: 18px;"><td style="width: 50%; height: 18px;">Geo Location Country</td><td style="width: 50%; height: 18px;">{{event.request.geoip.countryName}} </td></tr><tr style="height: 18px;"><td style="width: 50%; height: 18px;">Geo Location City</td><td style="width: 50%; height: 18px;">{{event.request.geoip.cityName}} </td></tr></tbody></table><p>Your Account was just signed in to from a new device. You\'re getting this email to make sure that it was you. If this is not you please reset your password.</p><br />Thanks ! </div></td></tr></tbody></table></center></body></html>';
        engine
            .parseAndRender(template, {event: ev})
            .then(function (renderedTemplate) {
                console.log(renderedTemplate);
                //sendSecurityNotification(renderedTemplate);
                sendSecurityNotificationSMTP(renderedTemplate);
                return renderedTemplate;
            })
            .catch(error => console.log(error));
    }

    function sendSecurityNotification(html) {
        // Set SENDGRID_API_KEY from secrets
        sgMail.setApiKey(event.secrets.SENDGRID_API_KEY);
        const mailOptions = {
            from: EMAIL_FROM,
            to: event.user.email,
            subject: EMAIL_SUBJECT,
            html: html
        };
        sgMail
            .send(mailOptions)
            .then((response) => {
                console.log(response[0].statusCode);
                console.log(response[0].headers);
            })
            .catch((error) => {
                console.error(error);
            });
    }

    async function sendSecurityNotificationSMTP(html) {
        /*
        * SMTP Transport object
        */
        console.log(`sendSecurityNotificationSMTP ${html}`);
        const smtpConfig = {
            host: event.secrets.SMTP_HOST,
            port: event.secrets.SMTP_PORT,
            secure: false, // upgrade later with STARTTLS
            auth: {
                user: event.secrets.SMTP_USERNAME,
                pass: event.secrets.SMTP_PASSWORD
            }
        };
        const transporter = nodemailer.createTransport(smtpConfig);
        const mailOptions = {
            from: EMAIL_FROM,
            to: event.user.email,
            subject: EMAIL_SUBJECT,
            html: html
        };
        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);

            } else {
                console.log(`Message sent: ${response.message}`);

            }
            // if you don't want to use this transport object anymore, uncomment following line
            // smtpTransport.close(); // shut down the connection pool, no more messages
        });
    }
};
