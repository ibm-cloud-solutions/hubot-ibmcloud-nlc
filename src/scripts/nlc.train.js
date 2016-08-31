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
const utils = require('hubot-ibmcloud-utils').utils;
const Conversation = require('hubot-conversation');
const env = require('../lib/env');
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

const TRAIN = /nlc (train|retrain)$/i;

module.exports = function(robot) {
	var switchBoard = new Conversation(robot);

	robot.on('nlc.train', (res) => {
		robot.logger.debug(`${TAG}: nlc.train - Natural Language match.`);
		train(res);
	});

	robot.respond(TRAIN, {id: 'nlc.train'}, (res) => {
		robot.logger.debug(`${TAG}: nlc.train - RegEx match.`);
		train(res);
	});

	function train(res){
		utils.getConfirmedResponse(res, switchBoard, i18n.__('nlc.train.prompt'), i18n.__('nlc.train.decline')).then((result) => {

			if (env.nlc_enabled) {
				robot.emit('ibmcloud.formatter', {response: res, message: i18n.__('nlc.train.new.session')});
				watsonServices.nlc.train().then(function(trainingResult){
					return watsonServices.nlc.monitorTraining(trainingResult.classifier_id);
				}).then(function(result){
					robot.emit('ibmcloud.formatter', {response: res, message: result.status_description});
				}).catch(function(err){
					robot.logger.error(`${TAG} Error while training a new classifier. Error=${JSON.stringify(err, null, 2)}`);
					robot.emit('ibmcloud.formatter', {response: res, message: i18n.__('nlc.train.error')});
				});
			}
			else {
				robot.logger.error(`${TAG}: Unable to start a training session because the Natural Language service has not been enabled.`);
				robot.emit('ibmcloud.formatter', {response: res, message: i18n.__('nlc.train.not.configured')});
			}
		});
	}
};
