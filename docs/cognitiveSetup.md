# Enable Cognitive Features in your Bot

To interact with your bot using natural language you must provide credentials to the IBM Watson and other services that power this feature. There are two available options for configuration depending on whether you choose the simple provisioning flow to run your bot on Bluemix or run your bot locally with the development configuration.

### Bluemix Services Used

This library uses the following IBM Bluemix services:
- [Watson Natural Language Classifier](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/docs/setup/nlc.md) (required)
- [Cloudant](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/docs/setup/cloudant.md) (optional)
- [Alchemy API](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/docs/setup/alchemy.md) (optional)

## Provisioning Configuration

In order to provision your bot on Bluemix to use the cognitive learning services you can either provide existing credentials or, if service instances do not exist, they can simply be created through the provisioning flow.

## Development Configuration

### Dependencies

Include these scripts in your bot's `external-scripts.json`:
```
[
	"hubot-ibmcloud-auth",
	"hubot-ibmcloud-nlc"
]
```

### Environment

Take the environment variables obtained in the previous section and append to the end of `config/env`:
```
export HUBOT_WATSON_NLC_URL
export HUBOT_WATSON_NLC_USERNAME
export HUBOT_WATSON_NLC_PASSWORD
export HUBOT_WATSON_NLC_CLASSIFIER
```

**(Optional)**
```
export HUBOT_CLOUDANT_ENDPOINT
export HUBOT_CLOUDANT_KEY
export HUBOT_CLOUDANT_PASSWORD
export HUBOT_CLOUDANT_DB
export HUBOT_WATSON_ALCHEMY_URL
export HUBOT_WATSON_ALCHEMY_APIKEY
export HUBOT_WATSON_ALCHEMY_DATASET
```

Authorize your user ID to access the commands. For more details see the documentation for [`hubot-ibmcloud-auth`](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-auth#usage).
```
export HUBOT_IBMCLOUD_POWERUSERS
export HUBOT_IBMCLOUD_READERUSERS
export HUBOT_IBMCLOUD_AUTHENTICATION_DISABLED
```
