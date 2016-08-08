/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const path = require('path');
const env = require(path.resolve(__dirname, '..', 'lib', 'env'));
const NLCManager = require('hubot-ibmcloud-cognitive-lib').nlcManager;

var nlcManager;
if (env.nlc_enabled) {
	var watson_nlc_opts = {
		url: env.nlc_url,
		username: env.nlc_username,
		password: env.nlc_password,
		classifierName: env.nlc_classifier,
		version: 'v1'
	};
	nlcManager = new NLCManager(watson_nlc_opts);
}

module.exports.nlc = nlcManager;
