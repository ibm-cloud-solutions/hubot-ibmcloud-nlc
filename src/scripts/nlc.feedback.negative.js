// Description:
//	Capture negative feedback from user's natural language
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
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;
const constants = require(path.resolve(__dirname, '..', 'lib', 'constants'));

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
	robot.on(path.basename(__filename), (res, info) => {
		// promise result is cached
		nlcDb.open().then((db) => {
			handle(db, robot, res, info);
		}).catch((err) => {
			robot.logger.error(err);
		});
		robot.logger.debug(`${TAG} Detected negative feedback for Natural Language match`);
		res.send(i18n.__('nlc.feedback.negative'));
	});

	function handle(db, robot, res, info){
		res.send(i18n.__('nlc.feedback.negative'));
		if (info && info.id){
			// low / med event log path
			// save additional input texts to original 'target' document
			db.get(info.id).then((doc) => {
				doc.logs = info.logs;
				return db.put(doc);
			}).catch((err) => {
				res.reply(i18n.__('nlc.save.error'));
				robot.logger.error(err);
			});
		}
		else {
			// get user logs from the brain
			let userId = res.envelope.user.id;
			let key = userId + constants.LOGGER_KEY_SUFFIX;
			let info = robot.brain.get(key);
			if (info && info.logs){
				return db.post(info.logs, 'negative_fb');
			}
		}
	};

};
