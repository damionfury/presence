// This script will obtain the Slack ID of a user from their email address
// and log both the ID and their current presence. It does not accept 
// any input parameters.

const { WebClient } = require('@slack/web-api');
require('dotenv').config();

const web = new WebClient(process.env.SLACK_TOKEN);

(async () => {

  try {
    // Do not deploy the lambda without ensuring this is empty.
    const userData = await web.users.lookupByEmail({email: ""});
    const presence = await web.users.getPresence({user: userData.user.id});
    
    console.log(userData.user.id,": ",presence.presence);

  } catch (error) {
    console.log(error);
  }

})();
