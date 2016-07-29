/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const settings = {
	nlc_url: process.env.HUBOT_WATSON_NLC_URL,
	nlc_username: process.env.HUBOT_WATSON_NLC_USERNAME,
	nlc_password: process.env.HUBOT_WATSON_NLC_PASSWORD,
	nlc_classifier: process.env.HUBOT_WATSON_NLC_CLASSIFIER || 'default-hubot-classifier',
	highThreshold: process.env.CONFIDENCE_THRESHOLD_HIGH || '0.9',
	lowThreshold: process.env.CONFIDENCE_THRESHOLD_LOW || '0.3',
	messagesToSave: process.env.NEGATIVE_MESSAGES_SAVE_COUNT || '3',
	paramParsingDisabled: process.env.PARAM_PARSING_DISABLED || false,
	version: 'v1'
};

if (!settings.nlc_url) {
	console.error('HUBOT_WATSON_NLC_URL not set');
}

if (!settings.nlc_username) {
	console.error('HUBOT_WATSON_NLC_USERNAME not set');
}
if (!settings.nlc_password) {
	console.error('HUBOT_WATSON_NLC_PASSWORD not set');
}

if (!settings.nlc_classifier) {
	console.error('HUBOT_WATSON_NLC_CLASSIFIER not set');
}

settings.lowThreshold = parseFloat(settings.lowThreshold);
settings.highThreshold = parseFloat(settings.highThreshold);
settings.messagesToSave = parseInt(settings.messagesToSave, 10);

module.exports = settings;
