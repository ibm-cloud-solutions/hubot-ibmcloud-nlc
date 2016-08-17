// Description:
//	 Check status of your Hubot Watson Natural Language Classifier
//
// Configuration:
//	 HUBOT_WATSON_NLC_URL api for the Watson Natural Language Classifier service
//	 HUBOT_WATSON_NLC_USERNAME user ID for the Watson NLC service
//	 HUBOT_WATSON_NLC_PASSWORD password for the Watson NLC service
//	 HUBOT_WATSON_NLC_CLASSIFIER (OPTIONAL)name of the classifier for Watson NLC service
//
// Author:
//   reicruz
//
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

const env = require('../lib/env');
const utils = require('hubot-ibmcloud-utils').utils;
const Conversation = require('hubot-conversation');
const watsonServices = require(path.resolve(__dirname, '..', 'lib', 'watsonServices'));
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

const CLASSIFIER_STATUS = /nlc (status)$/i;

module.exports = function(robot) {
	var switchBoard = new Conversation(robot);
	var COLORS = {
		available: '#008571',
		training: '#ef4e38'
	};

	// Natural Language match
	robot.on('nlc.status', (res, parameters) => {
		robot.logger.debug(`${TAG}: nlc.status - Natural Language match.`);
		getStatus(res);
	});

	// RegEx match
	robot.respond(CLASSIFIER_STATUS, {id: 'nlc.status'}, function(res) {
		robot.logger.debug(`${TAG}: nlc.status - RegEx match.`);
		getStatus(res);
	});

	function getStatus(res) {
		if (env.nlc_enabled) {
			watsonServices.nlc.classifierList().then((list) => {
				// Filter classifiers that match Hubot NLC classifier name (default is default-hubot-classifer)
				var filteredClassifiers = list.filter((classifier) => {
					return classifier.name === env.nlc_classifier;
				});

				// Respond with most recent Available/Training classifier
				if (filteredClassifiers.length > 0) {
					var classifier = filteredClassifiers[0];
					robot.emit('ibmcloud.formatter', {
						response: res,
						attachments: [{
							title: classifier.name,
							color: classifier.status === 'Available' ? COLORS.available : COLORS.training,
							fields: [
								{title: 'status', value: classifier.status, short: true},
								{title: 'id', value: classifier.classifier_id, short: true},
								{title: 'created', value: (new Date(classifier.created)).toString()}
							]
						}]
					});

					// Check for new Training classifier and notify how long it's been training for
					for (var i = 0; i < filteredClassifiers.length; i++) {
						if (filteredClassifiers[i].status === 'Training') {
							var message = i18n.__('nlc.status.other.training', filteredClassifiers[i].duration);
							robot.emit('ibmcloud.formatter', {response: res, message: message});
							break;
						}
					}

					// Check and report new approved training data.
					nlcconfig.getAllClasses(new Date(classifier.created)).then((classes) => {
						let msg = classes.length === 0 ? i18n.__('nlc.status.no.statements') : i18n.__('nlc.status.new.statements', classes.length);
						robot.emit('ibmcloud.formatter', {
							response: res,
							message: msg
						});
					}).catch((error) => {
						robot.logger.error(`${TAG} Error while getting statements available for training. Error=${JSON.stringify(error, null, 2)}`);
					});
				}
				else {
					let prompt = i18n.__('nlc.status.prompt', env.nlc_classifier);
					let negativeResponse = i18n.__('nlc.train.decline');
					utils.getConfirmedResponse(res, switchBoard, prompt, negativeResponse).then((result) => {
						robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.train.new.session')});
						watsonServices.nlc.train().then(function(trainingResult){
							return watsonServices.nlc.monitorTraining(trainingResult.classifier_id);
						}).then(function(result){
							robot.emit('ibmcloud.formatter', { response: res, message: res.status_description});
						}).catch(function(err){
							robot.logger.error(`${TAG} Error while training a new classifier. Error=${JSON.stringify(err, null, 2)}`);
						});
					});
				}
			}).catch((err) => {
				robot.logger.error(`${TAG} Error while listing clasifier status. Error=${JSON.stringify(err, null, 2)}`);
			});
		}
		else {
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.train.not.configured')});
			robot.logger.error(`${TAG} NLC is not configured.`);
		}
	}
};
