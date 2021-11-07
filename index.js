const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const redis = require('redis');

require('dotenv').config()

const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});

const web = new WebClient(process.env.SLACK_TOKEN);
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);

client.on('error', err => {
    console.log('Error ' + err);
});

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on('message', (event) => {
    client.lpush("messages",JSON.stringify(event))
    client.llen("messages", function(_err, value){
        if (value > 1000){
            client.rpop("messages")
        }
    })
    web.chat.postMessage({ channel: "#confessions", text: event.text })
});

(async () => {
    const server = await slackEvents.start(process.env.PORT || 3000);
    console.log(`Listening for events on ${server.address().port}`);
})();