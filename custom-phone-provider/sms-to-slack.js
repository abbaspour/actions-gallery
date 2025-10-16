/**
 * Handler to be executed while sending an email notification
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {CustomPhoneProviderAPI} api - Methods and utilities to help change the behavior of sending a phone notification.
 */
exports.onExecuteCustomPhoneProvider = async (event, api) => {
    const SLACK_WEBHOOK_URL = event.secrets.SLACK_WEBHOOK_URL;

    console.log(`onExecuteCustomPhoneProvider event: ${JSON.stringify(event)}`);

    const {message_type, as_text, recipient} = event.notification;
    const slackText = `Type ${message_type} \nRecipient: ${recipient} \nMessage: ${as_text}`;

    const axios = require('axios');

    // send to slack
    const {data} =
        await axios({
            method: 'post',
            url: `${SLACK_WEBHOOK_URL}`,
            data: {
                text: slackText
            },
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 sec
        });

    console.log(`response from slack: ${data}`);
};