/**
 * Handler that will be called during the execution of a SendPhoneMessage flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {SendPhoneMessageAPI} api - Methods and utilities to help change the behavior of sending a phone message.
 */
const axios = require('axios');

exports.onExecuteSendPhoneMessage = async (event, api) => {
    const SLACK_WEBHOOK = event.secrets.SLACK_WEBHOOK;
    const {action, text, recipient} = event.message_options;
    const slackText = `Action ${action} \nRecipient: ${recipient} \nMessage: ${text}`;
    // send to slack
    const {data} =
        await axios({
            method: 'post',
            url: `${SLACK_WEBHOOK}`,
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
