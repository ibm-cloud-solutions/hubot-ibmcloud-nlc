// Description:
//	 List all classifiers in your Natural Language Classifier instances.
//
// Configuration:
//	 HUBOT_WATSON_NLC_URL api for the Watson Natural Language Classifier service
//	 HUBOT_WATSON_NLC_USERNAME user ID for the Watson NLC service
//	 HUBOT_WATSON_NLC_PASSWORD password for the Watson NLC service
//
// Author:
//   reicruz
//
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

const env = require('../lib/env');
const palette = require('hubot-ibmcloud-utils').palette;
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

const SHOW_CLASSIFIERS = /nlc (show|list)$/i;

module.exports = function(robot) {
	// Natural Language match
	robot.on('nlc.list', (res, parameters) => {
		robot.logger.debug(`${TAG}: nlc.list - Natural Language match.`);
		getClassifierList(res);
	});

	// RegEx match
	robot.respond(SHOW_CLASSIFIERS, {id: 'nlc.list'}, function(res) {
		robot.logger.debug(`${TAG}: nlc.list - RegEx match.`);
		getClassifierList(res);
	});

	function getClassifierList(res) {
		if (env.nlc_enabled) {
			watsonServices.nlc.classifierList().then((list) => {
				var attachments = list.map((classifier) => {
					var attachment = {
						title: classifier.name,
						color: classifier.status === 'Available' ? palette.available : palette.training
					};
					attachment.fields = [
						{title: 'status', value: classifier.status, short: true},
						{title: 'id', value: classifier.classifier_id, short: true}
					];
					if (classifier.duration) {
						attachment.fields.push({title: '', value: i18n.__('nlc.status.train.duration', classifier.duration) });
					}
					return attachment;
				});
				if (attachments.length === 0) {
					robot.logger.info(`${TAG}: No classifiers to list.`);
					robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.list.no.classifiers')});
				}
				else {
					robot.logger.info(`${TAG}: Listing ${attachments.length} classifiers.`);
					robot.emit('ibmcloud.formatter', {
						response: res,
						attachments
					});
				}
			}).catch((err) => {
				robot.logger.error(`${TAG} Error while listing classifiers. Error=${JSON.stringify(err, null, 2)}`);
			});
		}
		else {
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.train.not.configured')});
			robot.logger.error(`${TAG} NLC is not configured.`);
		}
	}
};
