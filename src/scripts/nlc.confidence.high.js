// Description:
//	Execute Natural Language requests with high confidence.
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
'use strict';

// ----------------------------------------------------
// Start of the HUBOT interactions.
// ----------------------------------------------------

const path = require('path');
const TAG = path.basename(__filename);
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;
const ParamManager = require('hubot-ibmcloud-cognitive-lib').paramManager;
const extractParameters = require('../lib/extractParameters');

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

	let paramManager = new ParamManager();

	robot.on(path.basename(__filename), (res, classification) => {
		// TODO: Remove displaying of top classes and confidence back to user.
		robot.logger.info(`${TAG} High confidence detected.`);
		robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.confidence.high.process', classification.top_class)});

		// promise result is cached
		nlcDb.open().then((db) => {
			handle(db, res, classification, robot);
		}).catch((err) => {
			robot.logger.error(`${TAG}: Error processing high confidence NLC for ${classification.top_class}. Error=${err}`);
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.unexpected.general')});
		});
	});


	function handle(db, res, classification, robot){
		// Call emit target if specified with parameter values
		nlcconfig.getClassEmitTarget(classification.top_class).then((tgt) => {
			if (tgt) {
				// Obtain statement from res removing the bot name
				var text = res.message.text.replace(robot.name, '').trim();
				paramManager.getParameters(classification.top_class, text, tgt.parameters).then((parameters) => {
					extractParameters.validateParameters(robot, res, paramManager, classification.top_class, text, tgt.parameters, parameters).then((validParameters) => {
						var authEmitParams = {
							emitTarget: tgt.target,
							emitParameters: validParameters
						};
						robot.logger.info(`${TAG} Emitting to NLC target ${tgt.target} with params=${validParameters}`);
						robot.emit('ibmcloud-auth-to-nlc', res, authEmitParams);
					}).catch(function(error) {
						robot.logger.error(`${TAG} Error occurred trying to validate parameters for top class; top class = ${classification.top_class}; text = ${text}; error = ${error}.`);
						robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.unexpected.general')});
					});
				}).catch(function(error) {
					robot.logger.error(`${TAG} Error occurred trying to obtain parameters for top class; top class = ${classification.top_class}; text = ${text}; error = ${error}.`);
					robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.unexpected.general')});
				});
			}
		}).catch((error) => {
			robot.logger.error(`${TAG} Error occurred trying to obtain emit target for top class; top class = ${classification.top_class}; error = ${error}.`);
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.unexpected.general')});
		});

		// Record high confidence (classified) NLC result for feedback loop metrics.
		db.post(classification, 'classified', classification.top_class).then(() => {
			robot.logger.debug(`${TAG} Saved high confidence (classified) NLC result for feedback loop metrics.`);
		}).catch((err) => {
			robot.logger.error(`${TAG} Error saving high confidence (classified) NLC feedback data. Error=${err}`);
		});
	}
};
