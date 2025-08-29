/**
 * @typedef {import('@auth0/actions/pre-user-registration/v2').Event} Event
 * @typedef {import('@auth0/actions/pre-user-registration/v2').PreUserRegistrationAPI} PreUserRegistrationAPI
 */

/*
 * Create or reuse a HubSpot contact for the registering user and store contact.id
 * in the user's app_metadata.contact_id.
 *
 * Author: Amin Abbaspour
 * Date: 2025-08-28
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * References
 *  - https://github.hubspot.com/hubspot-api-nodejs/
 *
 * Dependencies:
 *  - @hubspot/api-client
 *
 * Secrets:
 *  - HUBSPOT_PRIVATE_APP_ACCESS_TOKEN HubSpot private app token with contacts.read and write perm
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
    console.log('onExecutePreUserRegistration', JSON.stringify(event));
    
    try {
        const email = event.user && event.user.email;
        if (!email) {
            // Without an email we cannot create/search a HubSpot contact reliably
            api.access.deny('registration_error', 'Email is required to create a HubSpot contact');
            return;
        }

        const token = event.secrets && event.secrets.HUBSPOT_PRIVATE_APP_ACCESS_TOKEN;
        if (!token) {
            api.access.deny('configuration_error', 'Missing HUBSPOT_PRIVATE_APP_ACCESS_TOKEN secret');
            return;
        }

        // Lazy require to keep action environment lean
        const {Client} = require('@hubspot/api-client');

        const hubspot = new Client({accessToken: token});

        // Try to find an existing contact by email
        let contactId = null;
        try {
            const searchResp = await hubspot.crm.contacts.searchApi.doSearch({
                filterGroups: [
                    {
                        filters: [
                            {
                                propertyName: 'email',
                                operator: 'EQ',
                                value: email
                            }
                        ]
                    }
                ],
                limit: 1,
                properties: ['email']
            });
            const results = (searchResp && searchResp.results) || [];
            if (results.length > 0) {
                contactId = results[0].id;
            }
        } catch (e) {
            // If search fails, we'll attempt to create the contact below
            console.log('HubSpot search error (will attempt create):', e && e.message ? e.message : e);
        }

        if (!contactId) {
            // Prepare properties
            const first = event.user.given_name || event.user.firstName || '';
            const last = event.user.family_name || event.user.lastName || '';

            try {
                const createResp = await hubspot.crm.contacts.basicApi.create({
                    properties: {
                        email: email,
                        firstname: first,
                        lastname: last
                    }
                });
                if (createResp && createResp.id) {
                    contactId = createResp.id;
                } else if (createResp && createResp.body && createResp.body.id) {
                    // Some SDK versions nest data under body
                    contactId = createResp.body.id;
                }
            } catch (e) {
                // If creation fails because the contact already exists (409), try fetching it again
                const status = e && e.statusCode ? e.statusCode : (e && e.status ? e.status : null);
                if (status === 409) {
                    try {
                        const searchResp2 = await hubspot.crm.contacts.searchApi.doSearch({
                            filterGroups: [
                                {
                                    filters: [
                                        {
                                            propertyName: 'email',
                                            operator: 'EQ',
                                            value: email
                                        }
                                    ]
                                }
                            ],
                            limit: 1,
                            properties: ['email']
                        });
                        const results2 = (searchResp2 && searchResp2.results) || [];
                        if (results2.length > 0) {
                            contactId = results2[0].id;
                        }
                    } catch (e2) {
                        console.log('HubSpot second search after 409 failed:', e2 && e2.message ? e2.message : e2);
                    }
                } else {
                    console.log('HubSpot create error:', e && e.message ? e.message : e);
                }
            }
        }

        if (!contactId) {
            api.access.deny('registration_error', 'Failed to create or locate HubSpot contact');
            return;
        }

        console.log('HubSpot create contact:', contactId);

        // Persist contact id into app_metadata
        api.user.setAppMetadata('contact_id', contactId);
    } catch (err) {
        console.log('Unexpected error in pre-registration HubSpot action:', err && err.message ? err.message : err);
        api.access.deny('registration_error', 'Unexpected error while processing registration');
    }
};
