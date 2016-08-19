# Using Facebook Messenger with your bot

If you want to use Facebook Messenger to communicate with your bot,  get started with the following steps:

## Facebook setup

Follow the instructions from the link below to setup Facebook to obtain the `FB_PAGE_ID`, `FB_APP_ID`, `FB_APP_SECRET`, `FB_WEBHOOK_BASE`, and `FB_PAGE_TOKEN`.

- [Facebook setup instructions](http://cloudbots.ng.bluemix.net/docs/adapters/facebook.html)

## Configure the bot with Facebook Credentials
There are two available options for configuration depending on whether you choose the simple provisioning flow to run your bot on Bluemix or run your bot locally with the development configuration.

### Provisioning Configuration

In order to provision your bot on Bluemix to use Facebook Messenger you will need to supply the `FB_PAGE_ID`, `FB_APP_ID`, `FB_APP_SECRET`, `FB_WEBHOOK_BASE`, and `FB_PAGE_TOKEN` information obtained from the __Facebook setup__ section into the configuration wizard. See the __Provisioning on Bluemix__ section of the [README.md](../../README.md) for more information.

### Development Configuration

Take the Facebook values obtained in the previous section and append to the end of `config/env`:
```
export FB_PAGE_ID=xx
export FB_APP_ID=xx
export FB_APP_SECRET=xx
export FB_WEBHOOK_BASE=xx
export FB_PAGE_TOKEN=xx
```

#### Run with Facebook Adapter

To start Hubot using the Facebook adapter use: `npm run facebook`
