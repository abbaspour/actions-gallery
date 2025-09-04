/**
 * @typedef {import('@auth0/actions/pre-user-registration/v2').Event} Event
 * @typedef {import('@auth0/actions/pre-user-registration/v2').PreUserRegistrationAPI} PreUserRegistrationAPI
 */

/*
 * Create an Airtable record for the registering user and store the created record id
 * in the user's app_metadata.airtable_record_id.
 * Also attempts to store the Auth0 user id into Airtable, if available in the event (may not be in pre-registration).
 *
 * Author: Amin Abbaspour
 * Date: 2025-09-02
 * License: MIT (https://github.com/auth0/actions-gallery/blob/main/LICENSE)
 *
 * References
 *  - https://github.com/Airtable/airtable.js
 *
 * Dependencies:
 *  - airtable
 *
 * Secrets:
 *  - PERSONAL_ACCESS_TOKEN: Airtable Personal Access Token with read/write access to the base
 *  - BASE_ID: Airtable Base ID where the Users table lives
 *  - TABLE_ID: Airtable table name or ID (e.g., "Users" or "tblXXXXXXXXXXXXXX")
 *
 * Notes:
 *  - In Auth0 Pre-User Registration, an Auth0 user_id may not yet be available. If present on the event, it will be stored; otherwise, it will be omitted.
 *
 * @param {Event} event - Details about the context and user that is attempting to register.
 * @param {PreUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the signup.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  console.log('[Airtable] onExecutePreUserRegistration', JSON.stringify({
    email: event?.user?.email,
    user_id: event?.user?.user_id,
    client_id: event?.client?.client_id,
  }));

  try {
    const email = event.user && event.user.email;
    if (!email) {
      api.access.deny('registration_error', 'Email is required to create an Airtable user record');
      return;
    }

    const token = event.secrets && event.secrets.PERSONAL_ACCESS_TOKEN;
    const baseId = event.secrets && event.secrets.BASE_ID;
    const tableId = event.secrets && event.secrets.TABLE_ID;

    if (!token) {
      api.access.deny('configuration_error', 'Missing PERSONAL_ACCESS_TOKEN secret');
      return;
    }
    if (!baseId) {
      api.access.deny('configuration_error', 'Missing BASE_ID secret');
      return;
    }
    if (!tableId) {
      api.access.deny('configuration_error', 'Missing TABLE_ID secret');
      return;
    }

    // Lazy require to keep action bundle lean
    const Airtable = require('airtable');

    // Configure client using Personal Access Token
    const base = new Airtable({ apiKey: token }).base(baseId);

    const first = event.user.given_name || event.user.firstName || '';
    const last = event.user.family_name || event.user.lastName || '';
    const auth0UserId = event.user && event.user.user_id ? event.user.user_id : undefined;

    // Prepare fields object for Airtable. Adjust to common field names.
    const fields = {
      email: email,
    };
    if (first) fields['First Name'] = first;
    if (last) fields['Last Name'] = last;
    if (auth0UserId) fields['auth0_user_id'] = auth0UserId;

    let recordId = null;

    try {
      // Attempt to find existing record by Email to avoid duplicates
      // Note: This requires a view or field named 'Email'. If not present, the create will still work.
      const select = base(tableId).select({
        pageSize: 1,
        maxRecords: 1,
        filterByFormula: `LOWER({email}) = '${String(email).toLowerCase().replace(/'/g, '\'\'')}'`
      });

      const existing = await select.firstPage();
      if (existing && existing.length > 0) {
        recordId = existing[0].id;
        // Optionally patch missing auth0_user_id
        if (auth0UserId) {
          try {
            const cur = existing[0].fields || {};
            if (!cur['auth0_user_id']) {
              await base(tableId).update(recordId, { 'auth0_user_id': auth0UserId });
            }
          } catch (uErr) {
            console.log('[Airtable] update existing record failed:', uErr && uErr.message ? uErr.message : uErr);
          }
        }
      }
    } catch (searchErr) {
      console.log('[Airtable] search by email failed (will attempt create):', searchErr && searchErr.message ? searchErr.message : searchErr);
    }

    if (!recordId) {
      try {
        const created = await base(tableId).create(fields);
        if (created && created.id) {
          recordId = created.id;
        }
      } catch (createErr) {
        console.log('[Airtable] create record failed:', createErr && createErr.message ? createErr.message : createErr);
      }
    }

    if (!recordId) {
      api.access.deny('registration_error', 'Failed to create or locate Airtable user record');
      return;
    }

    console.log('[Airtable] user record id:', recordId);

    // Persist Airtable record id into app_metadata
    api.user.setAppMetadata('airtable_record_id', recordId);
  } catch (err) {
    console.log('Unexpected error in pre-registration Airtable action:', err && err.message ? err.message : err);
    api.access.deny('registration_error', 'Unexpected error while processing registration');
  }
};
