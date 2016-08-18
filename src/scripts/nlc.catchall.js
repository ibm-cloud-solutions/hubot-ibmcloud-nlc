// Description:
//      Listens for commands to initiate actions against Bluemix
//
// Configuration:
//       HUBOT_BLUEMIX_API Bluemix API URL
//       HUBOT_BLUEMIX_ORG Bluemix Organization
//       HUBOT_BLUEMIX_SPACE Bluemix space
//       HUBOT_BLUEMIX_USER Bluemix User ID
//       HUBOT_BLUEMIX_PASSWORD Password for the Bluemix User
//
// Author:
//   houghtoj
//   nbarker
//

/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const path = require('path');
const TAG = path.basename(__filename);
const env = require(path.resolve(__dirname, '..', 'lib', 'env'));
const watsonServices = require(path.resolve(__dirname, '..', 'lib', 'watsonServices'));

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

let botName;

/**
 * Strips the bot name from the given statement.
 */
function stripBotName(text) {
	var nameToken = new RegExp('(^|\\s)@?' + botName + ':?\\s', 'g');
	return text.replace(nameToken, ' ').trim();
}

/**
 * If a statement does not match any regular expressions for commands, then NLC/RE processing is
 * invoked to determine the class best fitting the statement and pulling parameter values from the
 * statement.
 * First, NLC is invoked with the statement to determine the class that best fits the statement.
 * Second, RE is invoked with the statement and the class to attempt to find parameter values in the
 * statement for each of the parameters configured for the class.
 * Third, An emitter event is triggered to the emitter defined for the class with the parameter values.
 */
function processNLC(robot, text) {
	return new Promise((resolve, reject) => {
		// Invoke the NLC classifier to obtain a class best fitting the statement
		return watsonServices.nlc.classify(text).then((response) => {
			// If a best class is found, continue processing
			if (response.top_class) {

				// If high confidence emit to nlc.confidence.high.js to handle
				if (response.classes[0].confidence > env.highThreshold){
					resolve({
						target: 'nlc.confidence.high',
						parameters: response
					});
				}
				// If medium confidence emit to nlc.confidence.med.js to handle
				else if (response.classes[0].confidence > env.lowThreshold && response.classes[0].confidence <= env.highThreshold){
					resolve({
						target: 'nlc.confidence.med',
						parameters: response
					});
				}

				// If low confidence emit to nlc.confidence.low.js to handle
				else {
					resolve({
						target: 'nlc.confidence.low',
						parameters: response
					});

				}
			}
			else {
				reject(response);
			}
		}).catch((error) => {
			robot.logger.error(`${TAG} Error classifying natural language.`, error);
			reject(error);
		});
	});

}

// ----------------------------------------------------
// Start of the HUBOT interactions.
// ----------------------------------------------------

module.exports = function(robot) {
	botName = robot.name;

	if (env.nlc_enabled) {
		robot.logger.info(`${TAG} Registering Natural Language processing.`);
		robot.catchAll((res) => {
			// Respond only when the bot is addressed in a public room or if it's a private message. Ignore other bots.
			if (res.message.user.name !== 'hubot' &&
				(res.message.user.name === res.message.user.room ||
				res.message.text.indexOf(botName) >= 0)) {
				// Remove the bot name from the bot statement
				let text = stripBotName(res.message.text).trim();
				// make sure we have more than one word in the text
				if (text.split(' ').length > 1){
					processNLC(robot, text).then((result) => {
						robot.emit('ibmcloud-nlc-to-audit', res);
						robot.emit(result.target, res, result.parameters);
					},
					(reject) => {
						if (reject.status === 'Training') {
							robot.logger.info(`${TAG}: Unable to use Natural Language. ${reject.status_description}`);
							res.send(`${reject.status_description}`);
							res.send(i18n.__('nlc.error.fallback'));
						}
						else {
							throw reject;
						}
					}).catch((error) => {
						robot.logger.error(`${TAG}: Error occurred trying to classify statement using NLC; statement = ${text}; error = ${error.error}.`);
						res.send(i18n.__('nlc.error.unexpected.general'));
						res.send(i18n.__('nlc.error.fallback'));
					});
				}
			}
		});
	}
	else {
		robot.logger.info(`${TAG} Registering simple catchAll.  Natural Language processing is disabled.`);
		robot.catchAll((res) => {
			if (res.message.user.name === res.message.user.room ||
				res.message.text.indexOf(botName) >= 0) {
				// Remove the bot name from the bot statement
				let text = stripBotName(res.message.text).trim();
				// make sure we have more than one word in the text
				if (text.split(' ').length > 1){
					robot.logger.debug(`${TAG}: Unable to understand the statement. Natural Language processing is disabled.`);
					res.send(i18n.__('nlc.no.match'));
				}
			}
		});
	}
};
