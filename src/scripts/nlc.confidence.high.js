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
//
/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

// ----------------------------------------------------
// Start of the HUBOT interactions.
// ----------------------------------------------------

const path = require('path');
const TAG = path.basename(__filename);
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;
const EntityManager = require('hubot-ibmcloud-cognitive-entities').entityManager;

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

	let entityManager = new EntityManager();

	robot.on('nlc.confidence.high', (res, classification) => {
		robot.logger.info(`${TAG} NLC High confidence. Will process [${classification.top_class}] for statement [${classification.text}].`);

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
				let text = res.message.text.replace(robot.name, '').trim();
				entityManager.getEntities(robot, res, text, classification.top_class, tgt.parameters).then((parameters) => {
					let authEmitParams = {
						emitTarget: tgt.target,
						emitParameters: parameters
					};
					robot.logger.info(`${TAG} Emitting to NLC target ${tgt.target} with params=${parameters}`);
					robot.emit('ibmcloud-auth-to-nlc', res, authEmitParams);
				}).catch((error) => {
					robot.logger.error(`${TAG} Error occurred trying to obtain entity values for top class; top class = ${classification.top_class}; error = ${error}.`);
					robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.entities', error)});
				});
			}
			else {
				robot.logger.error(`${TAG} Could not find an emittarget and parameters for class ${classification.top_class}. Check the NLC configuration is correctly loaded and the Watson NLC instance is trained with the latest data.`);
				robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.unexpected.general')});
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
