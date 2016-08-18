// Description:
//	Listens for commands to initiate actions against Bluemix
//
// Configuration:
//	 HUBOT_WATSON_NLC_URL api for the Watson Natural Language Classifier service
//	 HUBOT_WATSON_NLC_USERNAME user ID for the Watson NLC service
//	 HUBOT_WATSON_NLC_PASSWORD password for the Watson NLC service
//	 HUBOT_WATSON_NLC_CLASSIFIER name of the classifier for Watson NLC service
//
// Author:
//   jpadilla
//	 reicruz
//
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
var i18n = new (require('i18n-2'))({
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

const NLC_HELP = /nlc (help)$/i;

module.exports = (robot) => {
	// Natural Language match
	robot.on('nlc.management.help', (res, parameters) => {
		robot.logger.debug(`${TAG}: Natural Language match. res.message.text=${res.message.text}.`);
		getHelp(robot, res);
	});

	// RegEx match
	robot.respond(NLC_HELP, {id: 'nlc.management.help'}, function(res) {
		robot.logger.debug(`${TAG}: RegEx match. res.message.text=${res.message.text}.`);
		getHelp(robot, res);
	});


	function getHelp(robot, res) {
		let help = `${robot.name} nlc status - ` + i18n.__('nlc.help.status') + '\n';
		help += `${robot.name} nlc list|show - ` + i18n.__('nlc.help.list') + '\n';
		help += `${robot.name} nlc train|retrain - ` + i18n.__('nlc.help.train') + '\n';
		help += `${robot.name} nlc auto approve [on|off|true|false] - ` + i18n.__('nlc.help.auto.approve') + '\n';

		let message = '\n' + help;
		robot.emit('ibmcloud.formatter', {response: res, message: message});
	};
};
