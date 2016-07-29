/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const fs = require('fs');
const path = require('path');

function readScripts(robot) {
	const scriptsPath = path.resolve(__dirname, 'src', 'scripts');
	fs.access(scriptsPath, fs.R_OK, (err) => {
		if (!err) {
			fs.readdir(scriptsPath, (err, files) => {
				if (!err) {
					// For each file, call loadFile, bound to robot, and using `scriptsPath` as the default first arg
					files.forEach(robot.loadFile.bind(robot, scriptsPath));
				}
			});
		}
	});
}

module.exports = (robot, scripts) => {
	robot.logger.info('Executing primary boot subroutine [hubot-ibmcloud-nlc]...');
	readScripts(robot);
};
