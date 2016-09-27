# Using Slack with your bot

If you want to use Slack to communicate with your bot,  get started with the following steps:

## Slack setup

Follow the instructions from the link below obtain a Slack token.

- [Slack setup instructions](https://github.com/ibm-cloud-solutions/cloudbot/blob/master/docs/adapters/slack.md)

## Configure the bot with Slack token
There are two available options for configuration depending on whether you choose the simple provisioning flow to run your bot on Bluemix or run your bot locally with the development configuration.

### Development Configuration

Take the Slack token that was obtained in the previous section and append the following environment information to the end of `config/env` file:
```
export HUBOT_SLACK_TOKEN=<TOKEN>
```

#### Run with Slack Adapter
To start Hubot using the Slack adapter use: `npm run slack`
