/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';
const expect = require('chai').expect;
const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');
const env = require('../src/lib/env');
const ParamManager = require('hubot-ibmcloud-cognitive-lib').paramManager;
const extractParameters = require('../src/lib/extractParameters');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../src/messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

const TEST_CLASS_PARAMETERS =
	[
		{
			name: 'param1',
			type: 'keyword',
			values: ['param1a', 'param1b'],
			prompt: 'Enter param 1'
		},
		{
			name: 'param2',
			type: 'keyword',
			values: ['param2a', 'param2b']
		},
		{
			name: 'param3',
			type: 'keyword',
			values: ['param3a', 'param3b'],
			prompt: 'Enter param 3'
		},
		{
			name: 'param4',
			type: 'keyword',
			values: ['param4a', 'param4b'],
			prompt: 'Enter param 4'
		}
	];

describe('Test the parameter validation / dialogs', function(){
	let room;
	let paramManager;

	beforeEach(function() {
		paramManager = new ParamManager();
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('No dialogs needed', function() {

		it('No parameters', function(done) {

			var parameters = {};
			var expValidatedParameters = {};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', null, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('All parameters have values', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

	});

	context('First dialog needed', function() {

		it('Parameter 1 missing', function(done) {

			var parameters = {
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[0].prompt)) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[0].values[0]}.`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 2 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[1].values[0]}.`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 3 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[2].values[0]}.`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 4 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[3].prompt)) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[3].values[0]}.`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Two parameters missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[1].values[0]}.`);
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[2].values[0]}.`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('All parameters missing', function(done) {

			var parameters = {
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[0].prompt)) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[0].values[0]}.`);
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[1].values[0]}.`);
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[2].values[0]}.`);
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[3].prompt)) {
					room.user.say('mimiron', `The parameter value of which you seek is ${TEST_CLASS_PARAMETERS[3].values[0]}.`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

	});

	context('Second dialog needed', function() {

		it('Parameter 1 missing', function(done) {

			var parameters = {
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[0].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param1'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[0].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 2 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[1].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 3 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[2].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 4 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[3].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param4'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[3].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Two parameters missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[1].values[0]}`);
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[2].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('All parameters missing', function(done) {

			var parameters = {
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[0].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param1'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[0].values[0]}`);
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[1].values[0]}`);
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[2].values[0]}`);
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[3].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param4'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[3].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

	});

	context('Second dialog failed', function() {

		it('Parameter 1 missing', function(done) {

			var parameters = {
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[0].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param1'))) {
					room.user.say('mimiron', ' ');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 2 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', ' ');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 3 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', ' ');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 4 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a'
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[3].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param4'))) {
					room.user.say('mimiron', ' ');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Two parameters missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', ' ');
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', ' ');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('All parameters missing', function(done) {

			var parameters = {
			};
			var expValidatedParameters = {
			};
			var replyFn = function(msg) {
				if (msg.includes(TEST_CLASS_PARAMETERS[0].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param1'))) {
					room.user.say('mimiron', ' ');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param', 'param2'))) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', ' ');
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[2].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', ' ');
				}
				else if (msg.includes(TEST_CLASS_PARAMETERS[3].prompt)) {
					room.user.say('mimiron', 'The parameter value of which you seek is invalidvalue.');
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param4'))) {
					room.user.say('mimiron', ' ');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

	});

});

describe('Test the parameter validation / dialogs with parameter parsing disabled', function(){
	let room;
	let paramManager;
	var saveParamParsingDisabled;

	before(function() {
		saveParamParsingDisabled = env.paramParsingDisabled;
		env.paramParsingDisabled = true;
	});

	after(function() {
		env.paramParsingDisabled = saveParamParsingDisabled;
	});

	beforeEach(function() {
		paramManager = new ParamManager();
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('No dialogs needed', function() {

		it('No parameters', function(done) {

			var parameters = {};
			var expValidatedParameters = {};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', null, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('All parameters have values', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

	});

	context('Single dialog needed', function() {

		it('Parameter 1 missing', function(done) {

			var parameters = {
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param1'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[0].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 2 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[1].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 3 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[2].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Parameter 4 missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param4'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[3].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('Two parameters missing', function(done) {

			var parameters = {
				param1: 'param1a',
				param4: 'param4a'
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[1].values[0]}`);
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[2].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

		it('All parameters missing', function(done) {

			var parameters = {
			};
			var expValidatedParameters = {
				param1: 'param1a',
				param2: 'param2a',
				param3: 'param3a',
				param4: 'param4a'
			};
			var replyFn = function(msg) {
				if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param1'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[0].values[0]}`);
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param2'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[1].values[0]}`);
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param3'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[2].values[0]}`);
				}
				else if (msg.includes(i18n.__('cognitive.prompt.param.again', 'param4'))) {
					room.user.say('mimiron', `${TEST_CLASS_PARAMETERS[3].values[0]}`);
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			extractParameters.validateParameters(room.robot, res, paramManager, 'class.A', 'An empy statement', TEST_CLASS_PARAMETERS, parameters).then(function(validatedParameters) {
				expect(validatedParameters).to.deep.equal(expValidatedParameters);
				done();
			}).catch(function(error) {
				done(error);
			});

		});

	});

});
