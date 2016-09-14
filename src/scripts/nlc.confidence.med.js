// Description:
//	Desambiguate Natural Language requests with medium confidence and record for future learning.
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
const utils = require('hubot-ibmcloud-utils').utils;
const logUtils = require('../lib/utils');
const Conversation = require('hubot-conversation');
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;
const EntityManager = require('hubot-ibmcloud-cognitive-entities').entityManager;
const env = require('../lib/env');

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

	let entityManager = new EntityManager(robot);
	let switchBoard = new Conversation(robot);

	robot.on('nlc.confidence.med', (res, classification) => {
		// promise result is cached
		nlcDb.open().then((db) => {
			let descriptionPromises = classification.classes.map((clz) => {
				return nlcconfig.getClassEmitTarget(clz.class_name).then((classData) => {
					return (classData && classData.description) ? classData.description : clz.class_name;
				});
			});

			Promise.all(descriptionPromises).then((descriptions) => {
				handle(db, res, classification, robot, descriptions);
			});
		}).catch((err) => {
			robot.logger.error(`${TAG}: Error processing medium confidence NLC result. Error=${err}`);
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.process.error')});
		});
	});


	function handle(db, res, classification, robot, descriptions){
		let prompt = i18n.__('nlc.confidence.med.prompt');
		let nOpts = 0;
		let l = classification.classes.length;
		let thresh = env.lowThreshold * 100;
		for (let i = 0; i < l; i++){
			let confidence = parseFloat(classification.classes[i].confidence * 100).toFixed(2);
			if (confidence > thresh){
				let pad = function(num, size) {
					let s = num + '';
					while (s.length < size) s = ' ' + s;
					return s;
				};
				prompt += `(${nOpts + 1}) [${pad(confidence, 5)}%] ${descriptions[i]}\n`;
				nOpts++;
			}
		}
		prompt += i18n.__('nlc.confidence.med.incorrect', nOpts + 1);

		const regex = utils.generateRegExpForNumberedList(nOpts + 1);

		utils.getExpectedResponse(res, robot, switchBoard, prompt, regex).then((result) => {
			let response = result.match[1];
			let resNum = parseInt(response, 10) - 1;
			if (resNum < nOpts){
				let selectedClass = classification.classes[resNum].class_name;
				robot.logger.info(`${TAG} NLC Med confidence. User selected class [${classification.classes[resNum].class_name}] for text [${classification.text}].`);

				// Call emit target if specified with parameter values
				nlcconfig.getClassEmitTarget(selectedClass).then((tgt) => {
					if (tgt) {
						// Obtain statement from res removing the bot name
						let text = res.message.text.replace(robot.name, '').trim();
						entityManager.getEntities(robot, res, text, selectedClass, tgt.parameters).then((parameters) => {
							let authEmitParams = {
								emitTarget: tgt.target,
								emitParameters: parameters
							};
							robot.logger.info(`${TAG} Emitting to NLC target ${tgt.target} with params=${parameters}`);
							robot.emit('ibmcloud-auth-to-nlc', res, authEmitParams);
						}).catch((error) => {
							robot.logger.error(`${TAG} Error occurred trying to obtain entity values for selected class; selected class = ${selectedClass}; error = ${error}.`);
							robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.entities', error)});
						});
					}
					else {
						robot.logger.error(`${TAG} Could not find an emittarget and parameters for class ${selectedClass}. Check the NLC configuration is correctly loaded and the Watson NLC instance is trained with the latest data.`);
						robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.unexpected.general')});
					}
				}).catch((error) => {
					robot.logger.error(`${TAG} Error occurred trying to obtain emit target for selected class; selected class = ${selectedClass}; error = ${error}.`);
					robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.error.unexpected.general')});
				});

				// Record medium confidence (learned) NLC result for feedback loop.
				db.post(classification, 'learned', selectedClass).then(() => {
					let userId = res.envelope.user.id;
					logUtils.logMessage(robot, res, userId, `${prompt}\n${resNum}`);
					robot.logger.debug(`${TAG} Saved medium confidence (learned) NLC result for learning.`);
				}).catch((err) => {
					robot.logger.error(`${TAG} Error saving medium confidence (learned) NLC feedback data. Error=${err}`);
				});
			}
			else {
				robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.confidence.med.error')});

				// Record medium confidence (unclassified) NLC result for feedback loop.
				db.post(classification, 'unclassified').then((doc) => {
					let userId = res.envelope.user.id;
					logUtils.logMessage(robot, res, userId, `${prompt}\n${nOpts}`, doc.id);
					robot.logger.debug(`${TAG} Saved medium confidence (unclassified) NLC result for learning.`);
				}).catch((err) => {
					robot.logger.error(`${TAG} Error saving medium confidence (no selection) NLC feedback data. Error=${err}`);
				});
			}
		}).catch((err) => {
			robot.logger.error(`${TAG}: Error in med confidence dialog. Error=${err}`);
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('nlc.process.error')});
		});
	}

};
