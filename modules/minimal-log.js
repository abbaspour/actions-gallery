/**
 * A shared utility function that can be used across multiple actions.
 */
module.exports = {
    log: function(msg) {
        const now = new Date();
        console.log(`${now.toLocaleDateString()} ${now.toLocaleTimeString()} - ${msg}`);
    },
};