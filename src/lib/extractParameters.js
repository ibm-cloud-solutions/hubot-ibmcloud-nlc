/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
'use strict';
var path = require('path');
var TAG = path.basename(__filename);

const utils = require('hubot-ibmcloud-utils').utils;
const Conversation = require('hubot-conversation');
const env = require('./env.js');

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

function extractOneWordParameter(resolve, reject, robot, res, switchBoard, classParameter) {

	var prompt = i18n.__('cognitive.prompt.param.again', classParameter.name);
	utils.getExpectedResponse(res, robot, switchBoard, prompt, /(.*)/i).then((dialogResult) => {
		var reply = dialogResult.match[1];
		robot.logger.debug(`${TAG}: Dialog reply is: ${reply}`);
		if (reply.indexOf(' ') === -1){
			robot.logger.info(`${TAG}: User response for ${classParameter.name} is: ${reply}`);
			resolve(reply);
		}
		else {
			resolve();
		}
	});

}

function extractParameter(robot, res, switchBoard, paramManager, className, classParameter){
	return new Promise(function(resolve, reject) {

		// When Parameter Parsing is disabled, dialog response must be a single word.
		if (env.paramParsingDisabled) {
			robot.logger.info('Parameter parsing has not been disabled. Expecting single word for the reply.');
			extractOneWordParameter(resolve, reject, robot, res, switchBoard, classParameter);
		}

		// Prompt user to enter parameter value (could be statement or just value)
		else {

			let prompt = classParameter.prompt || i18n.__('cognitive.prompt.param', classParameter.name);

			utils.getExpectedResponse(res, robot, switchBoard, prompt, /(.*)/i).then((dialogResult) => {
				var reply = dialogResult.match[1];
				robot.logger.debug(`${TAG}: Dialog reply is: ${reply}`);
				if (reply.indexOf(' ') === -1){
					robot.logger.info(`${TAG}: User replied with 1 word containing the value for the ${classParameter.name} parameter: ${reply}`);
					resolve(reply);
				}
				else {
					paramManager.getParameters(className, reply, [classParameter]).then((parameters) => {
						if (parameters[classParameter.name]) {
							robot.logger.debug(`${TAG}: Extracted value for the ${classParameter.name} parameter from reply is: ${parameters[classParameter.name]}`);
							resolve(parameters[classParameter.name]);
						}
						else {
							robot.logger.info(`${TAG}: Couldn\'t extract the value for the ${classParameter.name} parameter, please say only the parameter value.`);
							extractOneWordParameter(resolve, reject, robot, res, switchBoard, classParameter);
						}
					}).catch((err) => {
						robot.logger.error(`${TAG}: Error extracting Parameter. ${err}`);
						reject(err);
					});
				}
			}).catch((error) => {
				robot.logger.error(`${TAG}: Error on dialog.  ${error}`);
				reject(error);
			});
		}
	});
}

/**
 * Validates that all required parameters have values.
 * If a required parameter does not have a value extracted by the ParamManager, then
 * attempt to use a Dialog with the user to obtain the parameter value.
 * An object is returned specifying a value for each parameter (if a value is found).
 * @param className The name of the class being processed.
 * @param statement The statement to process (containing the parameter values).
 * @param classParameters The class parameters defined for the class being processed.
 * @param parameters The original set of parameter values.
 * @return A new map of parameter name -> parameter value.
 */
module.exports.validateParameters = function(robot, res, paramManager, className, statement, classParameters, parameters) {
	return new Promise(function(resolve, reject) {
		// The same Conversation must be used or the same reply is returned for each parameter.
		let switchBoard = new Conversation(robot);

		if (classParameters && classParameters.length > 0) {

			// Determine if any parameter values are missing.
			// If so, queue function to extract parameter value.
			var missingClassParameters = [];
			for (var i = 0; i < classParameters.length; i++) {
				var classParameter = classParameters[i];
				if (!parameters[classParameter.name] && classParameter.required !== 'false') {
					missingClassParameters.push(classParameter);
				}
			}

			// If there are missing parameter values, then attempt to extract the values.
			if (missingClassParameters.length > 0) {
				var prom = Promise.resolve();
				return missingClassParameters.reduce(function(p, missingClassParameter) {
					return p.then(function() {
						return extractParameter(robot, res, switchBoard, paramManager, className, missingClassParameter);
					}).then(function(missingValue) {
						if (missingValue) parameters[missingClassParameter.name] = missingValue;
					});
				}, prom).then(function() {
					resolve(parameters);
				}).catch(function(err) {
					reject(err);
				});
			}

			// If no missing parameter values ... we're done.
			else {
				resolve(parameters);
			}

		}

		// If no parameters associated with class ... we're done.
		else {
			resolve({});
		}

	});
};
