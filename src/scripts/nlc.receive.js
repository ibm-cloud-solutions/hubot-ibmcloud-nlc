// Description:
//      Listens for commands to initiate actions against Bluemix
//
// Configuration:
//       HUBOT_BLUEMIX_API Bluemix API URL
//       HUBOT_BLUEMIX_ORG Bluemix Organization
//       HUBOT_BLUEMIX_SPACE Bluemix space
//       HUBOT_BLUEMIX_USER Bluemix User ID
//       HUBOT_BLUEMIX_PASSWORD Password for the Bluemix User
//
// Author:
//   nbarker
//

/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const path = require('path');
const env = require(path.resolve(__dirname, '..', 'lib', 'env'));
const constants = require(path.resolve(__dirname, '..', 'lib', 'constants'));

function logMessage(robot, res, key, text) {
	let info = robot.brain.get(key) || {
		logs: []
	};
	// messagesToSave is trigged by a low or medium confidence result event flow
	if (info && info.messagesToSave){
		info.logs.push(text);

		info.messagesToSave = info.messagesToSave - 1;
		if (info.messagesToSave === 0){
			robot.emit('nlc.feedback.negative.js', res, info);
			info = null;
		}
	}
	else {
		// general log flow, save current and previous
		// messagesToSave is used as the default for both historical and future requests
		info.logs.push(text);

		if (info.logs.length > (2 * env.messagesToSave)){
			info.logs = info.logs.slice(1);
		}
	}

	robot.brain.set(key, info);
}

module.exports = function(robot) {
	const botName = robot.name;

	robot.receiveMiddleware((context, next, done) => {
		let res = context.response;

		if (res.message.text){
			let text = res.message.text;

			if (text.indexOf(botName) >= 0) {
				// Remove the bot name from the bot statement
				if (text.indexOf(botName) >= 0){
					let botnameIndex = text.indexOf(botName);
					text = text.substring(botnameIndex + botName.length);
				}
			}

			// make sure we have more than one word in the text
			if (text.split(' ').length > 1){
				let userId = res.envelope.user.id;
				let key = userId + constants.LOGGER_KEY_SUFFIX;
				logMessage(robot, res, key, text.trim());
			}
		}

		next(done);
	});

};
