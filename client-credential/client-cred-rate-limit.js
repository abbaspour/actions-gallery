/**
 * Rate limit the number of client_credentials tokens issued to configured clients in Auth0
 *
 * Author: Vikas Jayaram <vikas@okta.com>
 * Date: 2023-11-24
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * TODO: Terraform & code review & unit test
 *
 * @param {Event} event - Details about client credentials grant request.
 * @param {CredentialsExchangeAPI} api - Interface whose methods can be used to change the behavior of client credentials grant.
 */
const AWS = require('aws-sdk');
const merge = require('lodash.merge');
const REQUEST_HISTORY_TABLE_NAME = '<DYNAMO_DB_TABLE_NAME_FOR_RATE_LIMITS>';
const AWS_REGION = '<AWS_REGION>';
const MAX_REQUEST_HISTORY_SIZE = 100;

exports.onExecuteCredentialsExchange = async (event, api) => {
    const {client, secrets} = event;
    const rateLimits = { //default options
        enabled: true,
        rateLimitPerTimePeriod: 10,
        timePeriod: 1000 * 60 * 60 * 24 // 24 hours
    };
    if (client.metadata && client.metadata.rateLimits) {
        merge(rateLimits, JSON.parse(client.metadata.rateLimits));
    }
    if (rateLimits.enabled) {
        AWS.config.update({
            credentials: new AWS.Credentials(
                secrets.AWS_ACCESS_KEY_ID,
                secrets.AWS_SECRET_ACCESS_KEY
            ),
            region: AWS_REGION
        });
        const dynamo = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
        try {
            const rateLimited = await getRequestHistory(client.client_id, dynamo)
                .then(requestHistory => requestHistory.filter(requestTime => requestTime > Date.now() - rateLimits.timePeriod))
                .then(requestHistoryWithinTimePeriod => isRateLimited(requestHistoryWithinTimePeriod, rateLimits))
                .then(clientState => updateRequestHistory(client.client_id, clientState, dynamo))
                .then(isRL => {
                    return isRL;
                });
            if (rateLimited) {
                return api.access.deny('invalid_request', `Client ${client.name} (${client.client_id}) has 
                exceeded the rate limit of ${rateLimits.rateLimitPerTimePeriod} tokens every ${rateLimits.timePeriod / (1000 * 60 * 60)} hour/s`);
            }

        } catch (error) {
            console.log(error);
            return api.access.deny('server_error', 'Something Went wrong');
        }
    }
};

const getRequestHistory = async (clientId, dynamo) => {
    const params = {
        TableName: REQUEST_HISTORY_TABLE_NAME,
        Key: {'clientId': clientId},
        AttributesToGet: ['requestHistory']
    };
    return dynamo.get(params).promise()
        .then(data => (data.Item && data.Item.requestHistory ? data.Item.requestHistory : []))
        .catch(error => {
            console.warn(error);
            return [];
        });
};

const isRateLimited = (requestHistoryWithinTimePeriod, rateLimits) => {
    let isRateLimited = false;
    requestHistoryWithinTimePeriod.push(Date.now());
    console.log(requestHistoryWithinTimePeriod, rateLimits);
    const requestsWithinTimePeriod = requestHistoryWithinTimePeriod.length;
    if (requestsWithinTimePeriod > rateLimits.rateLimitPerTimePeriod) {
        isRateLimited = true;
        //prevent a runaway client from killing the performance
        if (requestsWithinTimePeriod > MAX_REQUEST_HISTORY_SIZE) {
            requestHistoryWithinTimePeriod = requestHistoryWithinTimePeriod.slice(requestsWithinTimePeriod - MAX_REQUEST_HISTORY_SIZE);
        }
    }
    return {
        isRateLimited,
        requestHistory: requestHistoryWithinTimePeriod
    };
};


const updateRequestHistory = async (clientId, clientState, dynamo) => {
    const params = {
        TableName: REQUEST_HISTORY_TABLE_NAME,
        Item: {
            clientId,
            requestHistory: clientState.requestHistory,
        }
    };
    return dynamo.put(params).promise()
        .then(() => clientState.isRateLimited)
        .catch((error) => {
            console.log(error);
            return false; //don't rate limit if there is a dynamodb error
        });
};