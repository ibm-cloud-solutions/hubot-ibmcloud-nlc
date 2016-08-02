/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const constants = require('./constants');
const env = require('./env');

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
				robot.emit('nlc.feedback.negative.js', res, info);
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

module.exports = {
	logMessage: logMessage
};
