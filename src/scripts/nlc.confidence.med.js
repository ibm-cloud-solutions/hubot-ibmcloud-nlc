// Description:
//	Desambiguate Natural Language requests with medium confidence and record for future learning.
//
// Configuration:
//	 HUBOT_CLOUDANT_ENDPOINT Cloudant URL
//	 HUBOT_CLOUDANT_KEY API key for Cloudant endpoint
//	 HUBOT_CLOUDANT_PASSWORD password for Cloudant endpoint
//	 HUBOT_WATSON_NLC_URL api for the Watson Natural Language Classifier service
//	 HUBOT_WATSON_NLC_USERNAME user ID for the Watson NLC service
//	 HUBOT_WATSON_NLC_PASSWORD password for the Watson NLC service
//	 HUBOT_WATSON_NLC_CLASSIFIER name of the classifier for Watson NLC service
//
// Author:
//   jpadilla
//
'use strict';

// ----------------------------------------------------
// Start of the HUBOT interactions.
// ----------------------------------------------------

const path = require('path');
const TAG = path.basename(__filename);
const utils = require('hubot-ibmcloud-utils').utils;
const Conversation = require('hubot-conversation');
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;
const ParamManager = require('hubot-ibmcloud-cognitive-lib').paramManager;
const extractParameters = require('../lib/extractParameters');
const env = require('../lib/env');
const constants = require('../lib/constants');

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

module.exports = function(robot) {

	var paramManager = new ParamManager();
	var switchBoard = new Conversation(robot);

	robot.on(path.basename(__filename), (res, classification) => {
		// promise result is cached
		nlcDb.open().then((db) => {
			handle(db, res, classification, robot);
		}).catch((err) => {
			robot.logger.error(err);
		});
	});


	function handle(db, res, classification, robot){
		let prompt = i18n.__('nlc.confidence.med.prompt');
		let nOpts = 0;
		let l = classification.classes.length;
		let thresh = env.lowThreshold * 100;
		for (let i = 0; i < l; i++){
			var confidence = parseFloat(classification.classes[i].confidence * 100).toFixed(2);
			if (confidence > thresh){
				let pad = function(num, size) {
					var s = num + '';
					while (s.length < size) s = ' ' + s;
					return s;
				};
				prompt += `(${i}) [${pad(confidence, 5)}%] ${classification.classes[i].class_name}\n`;
				nOpts++;
			}
		}
		prompt += i18n.__('nlc.confidence.med.incorrect', nOpts);

		var regex = new RegExp(`([0-${nOpts}]+)`);

		utils.getExpectedResponse(res, robot, switchBoard, prompt, regex).then((result) => {
			var response = result.message.rawText ? result.message.rawText.trim() : result.message.text.trim();
			var resNum = parseInt(response, 10);
			if (resNum < nOpts){
				var selectedClass = classification.classes[resNum].class_name;

				db.post(classification, 'learned', selectedClass).then(() => {
					res.reply(i18n.__('nlc.confidence.med.classify', classification.text, classification.classes[resNum].class_name));
					// Call emit target if specified with parameter values
					nlcconfig.getClassEmitTarget(selectedClass).then((tgt) => {
						if (tgt) {
							// Obtain statement from res removing the bot name
							var text = res.message.text.replace(robot.name, '').trim();
							paramManager.getParameters(selectedClass, text, tgt.parameters).then(function(parameters) {
								extractParameters.validateParameters(robot, res, paramManager, selectedClass, text, tgt.parameters, parameters).then(function(validParameters) {
									var authEmitParams = {
										emitTarget: tgt.target,
										emitParameters: validParameters
									};
									robot.emit('ibmcloud-auth-to-nlc', res, authEmitParams);
								}).catch(function(error) {
									robot.logger.error(`${TAG} Error occurred trying to obtain parameters for top class; top class = ${classification.top_class}; text = ${text}; error = ${error}.`);
								});
							}).catch(function(error) {
								robot.logger.error(`${TAG} Error occurred trying to obtain parameters for selected class; selected class = ${selectedClass}; text = ${text}; error = ${error}.`);
							});
						}
					}).catch((error) => {
						robot.logger.error(`${TAG} Error occurred trying to obtain emit target for selected class; selected class = ${selectedClass}; error = ${error}.`);
					});
				}).catch((err) => {
					res.reply(i18n.__('nlc.save.error'));
					robot.logger.error(err);
				});
			}
			else {
				db.post(classification, 'unclassified').then((doc) => {
					let userId = res.envelope.user.id;
					let key = userId + constants.LOGGER_KEY_SUFFIX;
					// info contains doc id
					// don't write over current logger
					let info = robot.brain.get(key) || {};
					if (!info.hasOwnProperty('messagesToSave')){
						info.messagesToSave = env.messagesToSave;
						info.id = doc.id;
						robot.brain.set(key, info);
					}
					res.reply(i18n.__('nlc.confidence.med.error'));
				}).catch((err) => {
					res.reply(i18n.__('nlc.save.error'));
					robot.logger.error(err);
				});
			}
		}).catch((err) => {
			res.reply(i18n.__('nlc.process.error'));
			robot.logger.error(err);
		});
	}

};
