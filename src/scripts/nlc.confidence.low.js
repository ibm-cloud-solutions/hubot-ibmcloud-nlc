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

	robot.on(path.basename(__filename), (res, classification) => {
		// promise result is cached
		nlcDb.open().then((db) => {
			robot.logger.info(`${TAG} Low confidence detected`);
			handle(db, res, classification, robot);
		}).catch((err) => {
			robot.logger.error(err);
		});
	});

	function handle(db, res, classification, robot){
		let prompt = i18n.__('nlc.confidence.low.prompt');

		db.post(classification, 'unclassified').then((doc) => {
			res.reply(prompt);
			let userId = res.envelope.user.id;
			utils.logMessage(robot, res, userId, null, doc.id);
		}).catch((err) => {
			res.reply(i18n.__('nlc.save.error'));
			robot.logger.error(err);
		});
	}
};
