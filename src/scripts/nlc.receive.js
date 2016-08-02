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
const utils = require(path.resolve(__dirname, '..', 'lib', 'utils'));

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
				utils.logMessage(robot, res, userId, text.trim());
			}
		}

		next(done);
	});

};
