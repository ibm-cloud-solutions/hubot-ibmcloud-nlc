[![Build Status](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-nlc.svg?branch=master)](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-nlc)
[![Coverage Status](https://coveralls.io/repos/github/ibm-cloud-solutions/hubot-ibmcloud-nlc/badge.svg?branch=cleanup)](https://coveralls.io/github/ibm-cloud-solutions/hubot-ibmcloud-nlc?branch=cleanup)
[![Dependency Status](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-nlc/badge)](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-nlc)
[![npm](https://img.shields.io/npm/v/hubot-ibmcloud-nlc.svg?maxAge=2592000)](https://www.npmjs.com/package/hubot-ibmcloud-nlc)

# hubot-ibmcloud-nlc

Starting point to add cognitive and natural language functionality to your Hubot.


## Getting Started
* [Overview](#overview)
* [Cognitive Integration](#cognitive_integration)
* [What is happening under the covers](#what-is-happening-under-the-covers)
* [License](#license)
* [Contribute](#contribute)

## Overview

If you can't remember when the right command is `exit`, `quit`, or `!q`, this project can help you to easily develop a bot that can understand natural language.

You won't have to think of every possible way your users could formulate a request.  With as litle as 3 training statements we can recognize other statements with the same meaning.  We use IBM Watson Natural Language Classifier to extract the intent of a statement.

We provide tools to help you improve your training data corpus based on what your users are actually asking.

We also help you pull parameter values from a statement entered by the user.  For instance, a user says:
`I want to scale application xyz to 4 instances`.
After the natural language processing has determined that this is a scale command, the needed parameter values (`appname` of `xyz` and `instances` of `4`) need to be pulled from the statement and forwarded to the function handling the command.


## Cognitive Integration

To integrate cognitive functionality in your Hubot

1. Add dependencies to `package.json`.
	``` json
	dependencies: {
		"hubot-ibmcloud-cognitive-lib": ">=0.0.19"
	},
	devDependencies: {
		"hubot-ibmcloud-auth": ">=0.0.8",
		"hubot-ibmcloud-nlc": ">=0.0.20"
	}
	```

1. Include these scripts in your bot's `external-scripts.json`.
	``` json
	[
	"hubot-ibmcloud-auth",
	"hubot-ibmcloud-nlc"
	]
	```

1. Authorize your user ID to access the commands.

	For more details see the documentation for `hubot-ibmcloud-auth`
	```
	HUBOT_IBMCLOUD_POWERUSERS=<comma-separated list of power-user emails -- no spaces!>
	HUBOT_IBMCLOUD_READERUSERS=<comma-separated list of reader-user emails -- no spaces!>
	HUBOT_IBMCLOUD_AUTHENTICATION_DISABLED=<only if desired, disables authentication and authorization if true)>
	```

1. From Bluemix, create a **Watson Natural Language Classifier** service and set the following environment variables with your credentials.
	```
	HUBOT_WATSON_NLC_URL=<API URL for Watson Natural Language Classifier>
	HUBOT_WATSON_NLC_USERNAME=<User Id for Watson Natural Language Classifier>
	HUBOT_WATSON_NLC_PASSWORD=<Password for Watson Natural Language Classifier>
	HUBOT_WATSON_NLC_CLASSIFIER=<(optional) Name for the classifier>
	```

1. (Optional) Configure Cognitive Learning (feedback loop).  For more information see: [docs/cognitiveLearning.md](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/docs/cognitiveLearning.md)
	```
	HUBOT_CLOUDANT_ENDPOINT=
	HUBOT_CLOUDANT_KEY=
	HUBOT_CLOUDANT_PASSWORD=
	HUBOT_CLOUDANT_DB=nlc
	```

1. (Optional) For Bluemix, create a **Watson Alchemy** service to use to find locations in statement and set the following environment variables.
	```
	HUBOT_WATSON_ALCHEMY_URL=<API URL for Watson Alchemy service>
	HUBOT_WATSON_ALCHEMY_APIKEY=<apikey for specific instance of Watson Alchemy service>
	HUBOT_WATSON_ALCHEMY_DATASET=<(optional) Dataset to use; default is ie-en-news>
	```

1. Create a Natural Language classification / parameter definition file.
	- For detailed information about the contents of this file see the documentation on `hubot-ibmcloud-cognitive-lib`
	- The file should be added at `<project>/src/nlc/NLC.json`.
	- Sample NLC.json for a weather bot.
	``` json
	{   
		"name": "hubot-ibmcloud-weather",
		"version": "0.0.1",
		"classes": [
			{
				"class": "weather",
				"emittarget": "weather.js",
				"texts": [
					"What is the weather?",
					"What are the current climate conditions?",
					"what's the weather like"
				],
				"parameters": [
					{
						"name": "location",  
						"type": "city",
						"prompt": "OK. What city would you like to know the weather for?"
					}
				]
			},
			{
				"class": "weather.precipitation",
				"emittarget": "weather.precipitation.js",
				"texts": [
					"Is it raining?",
					"Do I need to bring an umbrella?",
					"What's the chance of rain?"
				],
				"parameters": [
					{
						"name": "location",  
						"type": "city",
						"prompt": "OK. What city would you like to know the chance of rain for?"
					}
				]
			}
		]
	}
	```

1. Load the NLC training data into the database
	```
	$ initDb relative/path/to/NLC.json
	```
	- The default location is `src/nlc/NLC.json`
	- **NOTE:** npm should install `initDb` from `hubot-ibmcloud-cognitive-lib`. If you get a "command not found" error, you can access this script from `node_modules\.bin\initDb`

1. Train the Natural Language classifier.
	- Start your bot and say anything using natural language (ie. "I need help"). The bot should detect that a trained classifier isn't available and will start training.
	- **NOTE:** A training session takes about 15 minutes to complete.  The bot will notify you when training completes.
	- **NOTE:** More automation is still needed to re-train the classifier. You can start a training session at any time with `nlc:train`.

1. For your scripts to handle the commands, add an emit listener.  For the authorization flow to work, the emit target id in the robot.on() invocation should match the regex flow `id` value.  These should both match the 'emittarget' value specified in the JSON file.
	```javascript
	module.exports = (robot) => {
		robot.on('weather.precipitation', (res, parameters) => {
			robot.logger.debug(`Natural Language match.`);
			// Parameter values are obtain through the cognitive/nlc process.
			// Verify that required parameter values were succesfully obtained.
			if (parameters && parameters.location) {
				processWeather(res, paramaters.location);
			}
			else {
				robot.logger.error(`Some logged error.`);
				res.reply(i18n.__('some.user.message.with.error'));
			}
		});
		robot.respond(SHOW_WEATHER, {id: 'weather.precipitation'}, function(res) {
			roboat.logger.debug(`RegEx match.`);
			// Parameter values are set via regular expression match.
			// If a required parameter value is not specified, the regex match should fail.
			processWeather(res, res.match[N]);
		});

		function processWeather(res, location){
			...
		}
	```

1. Add `databases` to your `.gitignore` file.

1. Add test coverage.

	To invoke the NLC flow, you can use `robot.emit(<emittarget>)`.  The value for `emittarget` is what you have used in NLC.json. Here's a sample test:
	``` javascript
	it('should start `testApp01`', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain('Starting application *testApp1Name* in the *testSpace* space.');
				done();
			});

			var res = { message: {text: 'I want to start app testApp1Name'}, response: room };
			room.robot.emit('bluemix.app.start', res, { appname: 'testApp1Name' });
		});
	```


## What is happening under the covers

The intended general flow for the natural language processing is as follows:

1. For statements not handled by the bot via regular expressions, the NLC processing within this package is invoked to find a class that best matches the statement.  This is done using the Watson Natural Language classifier that was trained using the various NLC JSON definitions.

1. Once a class has been found for the statement, now the parameter values needed to process that command need to be pulled from the statement.  The parameter definitions for the class in the NLC JSON file are used to do this:

 * One pass is made for each parameter to pull the parameter value from the statement using the parameter type.  This is done my invoking a function for that parameter type that uses hard-coded values, the 'poc' package, and/or the Watson Alchemy service to attempt to find the right parameter value.

 * A second pass is made for each parameter for which a value was not obtained on the first pass.  On this pass, the statement is modified to remove all parameter values successfully obtained on the first pass.  The same parameter type function used in the first pass is used again on this pass.

 * Finally, if both passes do not provide a value for one or more required parameters, then a bot conversation is used to ask the user for each missing parameter value.  When the user responds, the response is used to pull the value using the two passes above.  If this still fails, the user is asked to specify just the parameter value as a single word.  When the user responds to this, the response is assumed to be the parameter value.

1. After the class has been determined and the parameter values obtained, then the emit target associated with the class and the parameters are forwarded to the auth component to make sure that the user has the authority to issue this command.

1. If the user is authorized to issue the command, then the emit target associated with the command is invoked with the parameters.

1. The emit target listener within the command script gets control.  It should validate that it has the needed parameter values and then proceed with the same command processing that occurs if it had been received via the regex path.


## License

See [LICENSE.txt](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/LICENSE.txt) for license information.

## Contribute

Please check out our [Contribution Guidelines](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/CONTRIBUTING.md) for detailed information on how you can lend a hand.
