/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const constants = require('./constants');
const env = require('./env');
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;

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

function logMessage(robot, res, userId, text, tgt) {
	let key = userId + constants.LOGGER_KEY_SUFFIX;
	let info = robot.brain.get(key) || {
		logs: [],
		messagesToSave: env.messagesToSave
	};

	// include a target document is trigged by a low or medium confidence result event flow
	if (tgt !== undefined){
		// don't overwrite existing target
		if (!info.hasOwnProperty('id'))
			info.id = tgt;
	}

	if ((text !== null) && (text !== undefined)){
		info.logs.push(text);

		if (info.hasOwnProperty('id')){
			info.messagesToSave = info.messagesToSave - 1;

			if (info.messagesToSave === 0){
				// remove original classified statement
				info.logs = info.logs.slice(1);
				// robot.emit('nlc.feedback.negative.js', res, info);
				handleFeedback(robot, res, info);
				info = null;
			}
		}
		else {
			// general log flow, save current and previous
			// messagesToSave is used as the default for both historical and future requests
			if (info.logs.length > (2 * env.messagesToSave)){
				info.logs = info.logs.slice(1);
			}
		}
	}

	robot.brain.set(key, info);
};


function handleFeedback(robot, res, info){
	nlcDb.open().then((db) => {
		if (info && info.id){
			// low / med event log path
			// save additional input texts to original 'target' document
			db.get(info.id).then((doc) => {
				doc.logs = info.logs;
				return db.put(doc);
			}).catch((err) => {
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
	}).catch((err) => {
		robot.logger.error(err);
	});
};


module.exports = {
	logMessage: logMessage,
	handleFeedback: handleFeedback
};
