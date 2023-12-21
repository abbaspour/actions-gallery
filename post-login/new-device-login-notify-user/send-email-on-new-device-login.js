/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
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
        // noinspection JSUnresolvedReference
        const template =  `${EMAIL_TEMPLATE}`;
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

    /*
    function sendSecurityNotification(html) {
        const sgMail = require('@sendgrid/mail');
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
    */

    async function sendSecurityNotificationSMTP(html) {
        /*
        * SMTP Transport object
        */
        console.log('sendSecurityNotificationSMTP');
        const smtpConfig = {
            host: event.secrets.SMTP_HOST,
            port: event.secrets.SMTP_PORT,
            secure: false, // upgrade later with STARTTLS
            auth: {
                user: event.secrets.SMTP_USER,
                pass: event.secrets.SMTP_PASS
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
                const message = response.message;
                // eslint-disable-next-line prefer-template
                console.log('response from send email to ' + event.user.email + ': ' + message);

            }
            // if you don't want to use this transport object anymore, uncomment following line
            transporter.close(); // shut down the connection pool, no more messages
        });
    }
};
