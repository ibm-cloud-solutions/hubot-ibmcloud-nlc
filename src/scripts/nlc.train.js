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
//   jpadilla
//
'use strict';

// ----------------------------------------------------
// Start of the HUBOT interactions.
// ----------------------------------------------------

const utils = require('hubot-ibmcloud-utils').utils;
const Conversation = require('hubot-conversation');
const NLCManager = require('hubot-ibmcloud-cognitive-lib').nlcManager;
const env = require('../lib/env');
var path = require('path');

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

const TRAIN = /nlc:train/i;

module.exports = function(robot) {

	var nlcManager = new NLCManager({
		url: env.nlc_url,
		username: env.nlc_username,
		password: env.nlc_password,
		classifierName: env.nlc_classifier,
		version: 'v1'
	}, robot);

	var switchBoard = new Conversation(robot);

	robot.on(path.basename(__filename), (res) => {
		train(res);
	});

	robot.respond(TRAIN, {id: 'bluemix.nlc.train'}, (res) => {
		train(res);
	});

	function train(res){
		utils.getConfirmedResponse(res, switchBoard, i18n.__('nlc.train.prompt'), i18n.__('nlc.train.decline')).then((result) => {

			res.reply(i18n.__('nlc.train.new.session'));

			nlcManager.train().then(function(trainingResult){
				res.reply(trainingResult.status_description);
				return nlcManager.monitorTraining(trainingResult.classifier_id);
			}).then(function(result){
				res.reply(result.status_description);
			}).catch(function(err){
				robot.logger.error('Error while training a new classifier', err);
			});
		});
	}
};
