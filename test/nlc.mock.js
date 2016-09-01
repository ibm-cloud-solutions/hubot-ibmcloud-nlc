/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';
const nock = require('nock');
const path = require('path');
const env = require(path.resolve(__dirname, '..', 'src', 'lib', 'env'));

const nlcEndpoint = env.nlc_url;

const mockLowCfResult = require(path.resolve(__dirname, 'resources', 'mock.classifyLowResult.json'));
const mockMediumCfResult = require(path.resolve(__dirname, 'resources', 'mock.classifyMediumResult.json'));
const mockMediumNoCfResult = require(path.resolve(__dirname, 'resources', 'mock.classifyMediumNoClassResult.json'));
const mockHighCfResult = require(path.resolve(__dirname, 'resources', 'mock.classifyHighResult.json'));
const mockNegFbResult = require(path.resolve(__dirname, 'resources', 'mock.classifyNegFbResult.json'));
const mockHighUndefinedClassResult = require(path.resolve(__dirname, 'resources', 'mock.classifyHighUndefinedClassResult.json'));
const mockMedUndefinedClassResult = require(path.resolve(__dirname, 'resources', 'mock.classifyMedUndefinedClassResult.json'));

const mockClassifierList = require(path.resolve(__dirname, 'resources', 'mock.classifierList.json'));
const mockClassifierStatusAvailable = require(path.resolve(__dirname, 'resources', 'mock.classifierAvailable.json'));
const mockClassifierStatusTraining = require(path.resolve(__dirname, 'resources', 'mock.classifierTraining.json'));

module.exports = {
	setupMockery: function() {
		nock.cleanAll();
		nock.disableNetConnect();

		let nlcScope = nock(nlcEndpoint).persist();

		// Mock route to list all classifiers.
		nlcScope.get('/v1/classifiers')
		.reply(200, function(){
			return mockClassifierList.classifierList;
		});

		// Mock route for classifier status.
		nlcScope.get('/v1/classifiers/cd02b5x110-nlc-5103')
		.reply(200, mockClassifierStatusAvailable);

		// Mock route for classifier status.
		nlcScope.get('/v1/classifiers/cd02b5x110-nlc-5104')
		.reply(200, mockClassifierStatusTraining);

		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', function(body) {
			return body.text.includes('log');
		})
		.reply(200, mockLowCfResult);

		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', function(body) {
			return body.text.includes('negative');
		})
		.reply(200, mockNegFbResult);

		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', {
			text: 'low confidence result'
		})
		.reply(200, mockLowCfResult);

		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', {
			text: 'medium confidence result with no classification'
		})
		.reply(200, mockMediumNoCfResult);

		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', {
			text: 'medium confidence result'
		})
		.reply(200, mockMediumCfResult);

		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', {
			text: 'high confidence result'
		})
		.reply(200, mockHighCfResult);


		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', {
			text: 'High classification undefined'
		})
		.reply(200, mockHighUndefinedClassResult);

		// Mock route to get classification data.
		nlcScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', {
			text: 'Medium classification undefined'
		})
		.reply(200, mockMedUndefinedClassResult);
	},

	setupMockErrors: function(){
		nock.cleanAll();
		nock.disableNetConnect();
		let nlcErrorScope = nock(nlcEndpoint).persist();

		// Mock route to list all classifiers.
		nlcErrorScope.get('/v1/classifiers')
		.reply(500, function(){
			return 'Some 500 error message from the NLC service';
		});

		// Mock route for classifier status.
		nlcErrorScope.get('/v1/classifiers/cd02b5x110-nlc-5103')
		.reply(500, 'Some 500 error message from the NLC service');


		// Mock route to get classification data.
		nlcErrorScope.post('/v1/classifiers/cd02b5x110-nlc-5103/classify', {
			text: 'high confidence result'
		})
		.reply(500, 'Some 500 error message from the NLC service.');

	},

	setupMockEmpty: function(){
		nock.cleanAll();
		nock.disableNetConnect();

		let nlcStatusScope = nock(nlcEndpoint).persist();

		// Mock route to empty list of classifiers.
		nlcStatusScope.get('/v1/classifiers')
		.reply(200, function(){
			return mockClassifierList.emptyList;
		});
	}
};
