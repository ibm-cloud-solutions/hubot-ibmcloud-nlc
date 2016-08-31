// Description:
//	Record Natural Language requests with low confidence for future learning.
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
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;
const utils = require('../lib/utils');

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

	robot.on('nlc.confidence.low', (res, classification) => {
		robot.logger.info(`${TAG} NLC Low confidence. Statement [${classification.text}]`);
		robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.confidence.low.prompt')});

		// promise result is cached
		nlcDb.open().then((db) => {
			handle(db, res, classification, robot);
		}).catch((err) => {
			robot.logger.error(`${TAG} Error processing low confidence NLC result. Error=${err}`);
		});
	});

	function handle(db, res, classification, robot){
		// Record low confidence (unclassified) NLC result for feedback loop.
		db.post(classification, 'unclassified').then((doc) => {
			let userId = res.envelope.user.id;
			utils.logMessage(robot, res, userId, null, doc.id);
			robot.logger.debug(`${TAG} Saved low confidence (unclassified) NLC result for learning.`);
		}).catch((err) => {
			robot.logger.error(`${TAG} Error saving low confidence NLC feedback data. Error=${err}`);
		});
	}
};
