// Description:
//	 Analyze the data used to train the Watson Natural Language Classifier
//
// Configuration:
//	 HUBOT_WATSON_NLC_URL api for the Watson Natural Language Classifier service
//	 HUBOT_WATSON_NLC_USERNAME user ID for the Watson NLC service
//	 HUBOT_WATSON_NLC_PASSWORD password for the Watson NLC service
//	 HUBOT_WATSON_NLC_CLASSIFIER (OPTIONAL)name of the classifier for Watson NLC service
//
// Author:
//   jlpadilla
//
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

const env = require('../lib/env');
// const utils = require('hubot-ibmcloud-utils').utils;
// const palette = require('hubot-ibmcloud-utils').palette;
// const Conversation = require('hubot-conversation');
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

const NLC_DATA = /(nlc\sdata)\s?((\w|\.)*)?\s?((\w|-)*)?$/i;

module.exports = function(robot) {

	// Natural Language match
	robot.on('nlc.data', (res, parameters) => {
		robot.logger.debug(`${TAG}: nlc.data - Natural Language match.`);
		getNLCData(res);
	});

	// RegEx match
	robot.respond(NLC_DATA, {id: 'nlc.data'}, function(res) {
		robot.logger.debug(`${TAG}: nlc.data - RegEx match. `, res.match);
		getNLCData(res, res.match[2], res.match[4]);
	});

	function getNLCData(res, searchClassNames, classifierId) {
		if (env.nlc_enabled) {
			// NOTE: The ability to provide a classifierId is hidden because users of the bot
			// only have access to the current classifier. I'm leaving it here because it
			// was useful for development, we can document it if proven useful for users.
			new Promise((resolve, reject) => {
				if (classifierId){
					resolve(classifierId);
				}
				else {
					watsonServices.nlc.currentClassifier().then((classifier) => {
						resolve(classifier.classifier_id);
					});
				}
			})
			.then((classifierId) => {
				watsonServices.nlc.getClassifierData(classifierId).then((trained_data) => {
					robot.logger.debug(`${TAG}: Got classifier data for classifier with classifierId=${classifierId}.`);

					let totalStatements = 0;
					let totalClasses = 0;
					let fields = [];
					for (var key in trained_data) {
						totalClasses++;
						if (!searchClassNames || key.toLowerCase().indexOf(searchClassNames.toLowerCase()) >= 0) {
							totalStatements += trained_data[key].length;
							let values = '';
							trained_data[key].forEach(function(stmt){
								values += stmt + '\n';
							});
							fields.push({title: key, value: values, short: true});
						}
					}

					let msg = i18n.__('nlc.data.summary', classifierId, totalClasses, totalStatements);
					robot.emit('ibmcloud.formatter', {response: res, message: msg});
					robot.emit('ibmcloud.formatter', {response: res, attachments: [
						{
							title: i18n.__('nlc.data.title', classifierId),
							fields: fields,
							short: true
						}
					]});
				}).catch((err) => {
					robot.logger.error(`${TAG} Error getting classifier trained data. classifierId=${classifierId}`, err);
				});
			});
		}
		else {
			robot.logger.warning(`${TAG} NLC is not configured.`);
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.train.not.configured')});
		}
	}
};
