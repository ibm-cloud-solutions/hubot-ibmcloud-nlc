// Description:
//	Initiate training of a new Watson Natural Language Classifier
//
// Configuration:
//	 HUBOT_WATSON_NLC_URL api for the Watson Natural Language Classifier service
//	 HUBOT_WATSON_NLC_USERNAME user ID for the Watson NLC service
//	 HUBOT_WATSON_NLC_PASSWORD password for the Watson NLC service
//	 HUBOT_WATSON_NLC_CLASSIFIER name of the classifier for Watson NLC service
//
// Author:
//   reicruz
//
'use strict';

// ----------------------------------------------------
// Start of the HUBOT interactions.
// ----------------------------------------------------

const path = require('path');
const TAG = path.basename(__filename);
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;

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

const AUTO_APPROVE = /nlc\s(auto approve)\s?(on|off|true|false)?/i;

module.exports = function(robot) {
	robot.on(path.basename(__filename), (res, parameters) => {
		robot.logger.debug(`${TAG}: Natural Language match.`);
		if (parameters && parameters.autoapprove) {
			updateAutoApprove(res, parameters.autoapprove);
		}
		else {
			updateAutoApprove(res);
		}
	});

	robot.respond(AUTO_APPROVE, {id: 'nlc.auto.approve'}, (res) => {
		robot.logger.debug(`${TAG}: RegEx match.`);
		updateAutoApprove(res, res.match[2]);
	});

	function updateAutoApprove(res, value){
		var approve;
		if (value) {
			approve = ['on', 'true'].indexOf(value) > -1;
			nlcconfig.setAutoApprove(approve);
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.auto.approve.set', approve)});
		}
		else {
			approve = nlcconfig.getAutoApprove();
			var message = `${i18n.__('nlc.auto.approve.set', approve)} ${i18n.__('nlc.auto.approve.info')}`;
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	}
};
