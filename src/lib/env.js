/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

let settings = {
	nlc_url: process.env.VCAP_SERVICES_NATURAL_LANGUAGE_CLASSIFIER_0_CREDENTIALS_URL || process.env.HUBOT_WATSON_NLC_URL,
	nlc_username: process.env.VCAP_SERVICES_NATURAL_LANGUAGE_CLASSIFIER_0_CREDENTIALS_USERNAME || process.env.HUBOT_WATSON_NLC_USERNAME,
	nlc_password: process.env.VCAP_SERVICES_NATURAL_LANGUAGE_CLASSIFIER_0_CREDENTIALS_PASSWORD || process.env.HUBOT_WATSON_NLC_PASSWORD,
	nlc_classifier: process.env.HUBOT_WATSON_NLC_CLASSIFIER || 'default-hubot-classifier',
	highThreshold: process.env.CONFIDENCE_THRESHOLD_HIGH || '0.9',
	lowThreshold: process.env.CONFIDENCE_THRESHOLD_LOW || '0.3',
	messagesToSave: process.env.NEGATIVE_MESSAGES_SAVE_COUNT || '3',
	paramParsingDisabled: process.env.PARAM_PARSING_DISABLED || false
};

settings.nlc_enabled = settings.nlc_username && settings.nlc_password;

if (!settings.nlc_url) {
	console.warn('HUBOT_WATSON_NLC_URL not set. Using default URL for the service.');
}

if (!settings.nlc_username) {
	console.warn('HUBOT_WATSON_NLC_USERNAME not set');
}
if (!settings.nlc_password) {
	console.warn('HUBOT_WATSON_NLC_PASSWORD not set');
}

if (!settings.nlc_username || !settings.nlc_password){
	console.warn('Natural Language processing has been disabled because Watson Natural Language Clasifier service is not configured.');
}

settings.lowThreshold = parseFloat(settings.lowThreshold);
settings.highThreshold = parseFloat(settings.highThreshold);
settings.messagesToSave = parseInt(settings.messagesToSave, 10);

module.exports = settings;
