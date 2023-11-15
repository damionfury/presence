// Lambda for presence monitoring
// Event should be

const { WebClient } = require('@slack/web-api');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

// Create a new instance of the WebClient class with the token read from your environment variable
const web = new WebClient(process.env.SLACK_TOKEN);
const CWclient = new CloudWatchClient({region: process.env.AWS_REGION});


exports.handler = async (event, context) => {
    const timestamp = new Date();
    let state = 1;

    if (typeof(event.ids) !== 'object') {
        event.ids = JSON.parse(process.env.IDS); 
    }

    const results = await Promise.all(event.ids.map( async ( ID ) => {
        let presence = await web.users.getPresence({"user": ID});
        let result = {};
        result.id = ID;
        result.status = (presence.presence === 'active') ? 1 : 0;
        return result
    }));

    await Promise.all(results.map( async ( result ) => {
        const CWcommand = new PutMetricDataCommand({
            MetricData: [{
                MetricName: result.id,
                Dimensions: [{
                    Name: 'Environment',
                    Value: "development",
                }],
                Unit: 'None',
                Timestamp: timestamp,
                Value: result.status
            }],
            Namespace: "Presence"
        });

        try {
            const data = await CWclient.send(CWcommand);
            if (data.$metadata.httpStatusCode === 200) {
                console.log("Success – Sent", result.id)
            } else {
                throw new Error("CloudWatch response was HTTP " + data.httpStatusCode);
            };
          } catch (error) {
            console.error("Error at ID", result.id, error);
            state = 0;
          }

    }))
    
    console.log("Finished with checking presence for", event.ids.length, "IDs");
    return state
};