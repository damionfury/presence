# Presence Lambda
This is a Lambda that checks the Slack presence of a specified list of individuals and logs it to CloudWatch as a custom metric. This exists as a tool for performance improvement of specific individuals. It is not designed to be – and I will not assist in making it – a large scale monitor.

## Tooling note
This has been created to work with the `node-lambda` tool. If you do not already have it installed:

* `npm install -g node-lambda`
* `yarn global add node-lambda`

## Stack details
When fully setup, the stack consists of this Lambda which is triggered by EventBridge and sends custom metrics to CloudWatch under the Presence namespace. The Lambda only uses the Slack web-api and the AWS Javascript SDK version 3.

## How to deploy

1. Make sure event.json and getIDs.js have been scrubbed of sensitive data
2. Run `node-lambda package`
3. Navigate to the Lambda via the AWS Console and upload the .zip using the interface

Note: Yes, if setup correctly, node-lambda could do the deploy as well. I plan to migrate to CDK instead.

## How to test locally
Before you can test, you'll need to populate a `.env` file with a bunch of values:

```
AWS_ENVIRONMENT=development
AWS_ACCESS_KEY_ID=<access key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_SESSION_TOKEN=<session token IF you are using MFA>
AWS_REGION=<region for resources to go in>
AWS_FUNCTION_NAME=Presence
AWS_HANDLER=index.handler
AWS_MEMORY_SIZE=128
AWS_TIMEOUT=3
AWS_DESCRIPTION=
AWS_RUNTIME=nodejs14.x
EXCLUDE_GLOBS="event.json build/"
PACKAGE_DIRECTORY=build
SLACK_TOKEN=<bot token from slack admin>
IDS=[]
```

You'll need to replace several things with data that matches your own account. The token is something you should have access to if you have any business messing with this. IDS is an optional array of Slack user IDs as strings. When deployed, I suggest you not do that and instead pass the ids as part of the event trigger.

Once you have that created, you can test things locally with `node-lambda run`

If everything is working, you'll see some logs telling you that it successfully sent the metrics to CloudWatch and you'll be able to see those metrics in the custom namespace 'Presence' on the specified region.

## How to setup in AWS from scratch
This can be done _mostly_ from wizards.

### Part 1 - Create an IAM policy and role
Start by creating an IAM policy for this Lambda. The policy should only have a single permission: `cloudwatch:PutMetricData`. You should tag it with at least the `OwnerEmail` tag and a value of your email.

Next create a role for this Lambda. The role should be setup so that a Lambda may use the role and only has the policy you just created for it. You should tag it with at least the `OwnerEmail` tag and a value of your email.

Now you've got the permissions setup.

### Part 2 - Create the Lambda
This is pretty much done by wizard. This is very lightweight, so you can use the minimums everywhere. Configure it to use the Node.js 14 runtime with a handler of `index.handler` and `x86_64` architecture. The execution role is going to be the role you setup in Part 1. You will need to define two environment variables: `SLACK_TOKEN` & `AWS_REGION`. Use the token that has been assigned to the bot and the region you want your CloudWatch metrics sent to. Make sure you also tag the Lambda with `OwnerEmail` so people know who to contact.

Once everything is setup, you are ready to upload the code. Follow the steps in "How to Deploy".

### Part 3 - Create a trigger
This Lambda can be triggered in a couple ways. You could set up a system to invoke it and send in data, at which point your system will want to submit an array of IDs in the format shown in the `event.json` file.

The easiest way is to trigger it using EventBridge. You can create a scheduled trigger using the Lambda interface, and use the cron format to get it going. If you do nothing more than setup the event, the Lambda will need an `IDS` environment variable defined. The format is single-line Javascript array notation. Alternately, you can configure the event to submit the correct array (see `event.json`) every time it triggers. I recommend using this method as it's a little easier to adjust on the fly.

## How do I see the results?
The Lambda publishes custom metrics to CloudWatch. The namespace for the metrics is Presence and it's will publish to the region specified in the .env. The Slack IDs are the metrics that are published and the value is either 1 for active or 0 for away. From there, it's quite easy to configure a CloudWatch graph showing you the status over time.

## To do
- Convert this to deploy with CDK or other IaC solution