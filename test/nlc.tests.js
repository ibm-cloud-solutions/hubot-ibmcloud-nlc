/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';
const expect = require('chai').expect;
const Helper = require('hubot-test-helper');
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;
const sprinkles = require('mocha-sprinkles');
const helper = new Helper('../src/scripts');
const mockNLP = require('./nlc.mock');
const env = require('../src/lib/env');

const timeout = 5000;

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

function waitForDocType(db, type, rev, text){
	let docId;

	return sprinkles.eventually({
		timeout: timeout
	}, function() {
		return db.info({
			include_docs: true
		}).then((allDocs) => {
			let found = false;
			docId = null;

			for (let d of allDocs.rows){
				let doc = d.doc;
				if (doc.type === type){
					if (rev !== undefined){
						let docRev = parseInt(doc._rev[0], 10);
						if (rev === docRev){
							if (text !== undefined) {
								let txt = doc.classification.text;
								if (txt === text){
									found = true;
								}
							}
							else {
								// no text match specified
								found = true;
							}
						}
					}
					else {
						// no revision
						found = true;
					}
					if (found){
						docId = doc._id;
						break;
					}
				}
			}
			if (!found){
				throw new Error('too soon');
			}
		});
	}).then(() => false).catch(() => true).then((success) => {
		return docId;
	});
}

describe('Load modules through index', function() {

	let room;

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('load index`', function() {
		it('should load without problems', function() {
			require('../index')(room.robot);
		});
	});
});

describe('Test the NLC interaction', function(){
	let room;
	let db;

	before(function() {
		mockNLP.setupMockery();
		return nlcDb.open().then((res) => {
			db = res;
			return db.put({
				// add class with description
				_id: 'weather.alerts.js',
				description: 'Description for weather alerts classification',
				emittarget: 'weather.js'
			}).then(() => {
				// add class mapping for negative feedback testing
				return db.put({
					_id: 'nlc.feedback.negative',
					emittarget: 'nlc.feedback.negative'
				});
			}).then(() => {
				// add classifier data for current classifier, only if it hasn't been added. Data may exist if nlc.cognitive.tests runs first.
				return db.get('cd02b5x110-nlc-5103').catch(() => {
					return db.put({
						_id: 'cd02b5x110-nlc-5103',
						type: 'classifier_data',
						trainedData: 'Sample classification text,classification\nSample classification text 2,classification\nSample classification text 3,classification3'
					});
				});
			}).then(() => {
				// add classifier data
				return db.put({
					_id: 'cd02b5x110-nlc-0000',
					type: 'classifier_data',
					trainedData: 'Sample text,classification\nSample text 2,classification\nSample text 3,classification3'
				});
			});
		});
	});

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('user says a statement', function() {
		it('should emit a low classification event', function(done) {
			let cntr = 0;
			let docId;
			room.robot.on('nlc.confidence.low', (res, classification) => {
				if (cntr === 0){
					// check the database for the document miss
					waitForDocType(db, 'unclassified').then((id) => {
						// say something else and see if it is logged
						docId = id;
						room.user.say('mimiron', 'hubot log this - 1');
						room.user.say('mimiron', 'hubot log this - 2');
						room.user.say('mimiron', 'hubot log this - 3');
					});
				}
				if (cntr === env.messagesToSave){
					// check doc has a log field
					// wait for a document update with the log messages
					waitForDocType(db, 'unclassified', 2).then(() => {
						db.get(docId).then((doc) => {
							expect(doc.logs).to.exist;
							expect(doc.logs.length).to.eql(3);
							expect(doc.logs[0]).to.eql('log this - 1');
							expect(doc.logs[1]).to.eql('log this - 2');
							expect(doc.logs[2]).to.eql('log this - 3');
							done();
						});
					});
				}
				cntr++;
			});
			room.user.say('mimiron', 'hubot low confidence result');
		});

		it('should emit a medium classification event', function(done) {
			room.robot.on('nlc.confidence.med', (res, classification) => {
				return sprinkles.eventually({ timeout: timeout }, function(){
					if (room.messages.length < 2){
						throw new Error('too soon');
					}
				}).then(() => false).catch(() => true).then((success) => {
					// Verify description strings are used.
					expect(room.messages[1][1]).to.contain('(2) [20.64%] Description for weather alerts classification');

					// reply with correct
					room.user.say('mimiron', '2');
					// check the database for the document training
					return waitForDocType(db, 'learned').then((docId) => {
						db.get(docId).then((doc) => {
							done();
						});
					});
				});
			});
			// there will be a dialog with the user to select a match
			room.user.say('mimiron', 'hubot medium confidence result');
		});

		it('should emit a medium classification event and not be classified correctly', function(done) {
			const msg = 'medium confidence result with no classification';
			room.robot.on('nlc.confidence.med', (res, classification) => {
				return sprinkles.eventually({ timeout: timeout }, function(){
					if (room.messages.length < 2){
						throw new Error('too soon');
					}
				}).then(() => false).catch(() => true).then((success) => {
					// reply with incorrect
					room.user.say('mimiron', '3');

					// check the database for the document training
					return waitForDocType(db, 'unclassified', 1, msg).then((docId) => {
						// say a bunch to cause the log to be saved
						room.user.say('mimiron', 'hubot log this - 1');
						room.user.say('mimiron', 'hubot log this - 2');
						// the next message won't be logged
						room.user.say('mimiron', 'hubot log this - 3');

						return waitForDocType(db, 'unclassified', 2, msg).then((docId) => {
							db.get(docId).then((doc) => {
								expect(doc.logs.length).to.eql(3);
								// test dialog was captured
								expect(doc.logs[0].startsWith('[Med confidence]')).to.eql(true);
								expect(doc.logs[1]).to.eql('log this - 1');
								expect(doc.logs[2]).to.eql('log this - 2');
								done();
							});
						});

					});
				});
			});
			// there will be a dialog with the user to select a match
			room.user.say('mimiron', `hubot ${msg}`);
		});

		it('should emit a high classification event', function(done) {
			room.robot.on('nlc.confidence.high', (res, classification) => {
				// check the database for the document hit
				waitForDocType(db, 'classified').then(() => {
					done();
				});
			});
			room.user.say('mimiron', 'hubot high confidence result');
		});

		it('should emit a negative feedback event', function(done) {
			for (let i = 0; i < 9; i++){
				room.user.say('mimiron', `hubot high ${i}`);
			}
			room.user.say('mimiron', 'hubot negative feedback');

			room.robot.on('ibmcloud-auth-to-nlc', (res, target) => {
				if (target.emitTarget === 'nlc.feedback.negative'){
					room.robot.emit('nlc.feedback.negative', res);
				}
			});

			room.robot.on('nlc.feedback.negative', (res) => {
				// check the database for the document hit
				waitForDocType(db, 'negative_fb').then((docId) => {
					db.get(docId).then((doc) => {
						expect(doc.logs).to.exist;
						expect(doc.logs.length).to.eql(6);
						expect(doc.logs[5]).to.eql('negative feedback');
						expect(doc.logs[4]).to.eql('high 8');
						expect(doc.logs[3]).to.eql('high 7');
						expect(doc.logs[2]).to.eql('high 6');
						expect(doc.logs[1]).to.eql('high 5');
						expect(doc.logs[0]).to.eql('high 4');
						done();
					});
				});
			});

		});
	});

	describe('user asks for classifier status', function() {
		it('should reply with slack attachment with available classifier', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql('test-classifier');
					expect(event.attachments[0].fields[0].value).to.eql('Available');
					done();
				}
			});
			room.user.say('mimiron', '@hubot nlc status');
		});
	});

	describe('user asks for classifier data for current classifier', function() {
		it('should reply with slack attachment with current classifier data', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.message){
					expect(event.message).to.be.eql('NLC instance **cd02b5x110-nlc-5103** was trained with **2** classifications and **3** statements.');
				}
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql('Training Data for classifier ID cd02b5x110-nlc-5103');
					expect(event.attachments[0].fields).to.have.length(2);
					expect(event.attachments[0].fields[0].title).to.eql('classification');
					expect(event.attachments[0].fields[0].value).to.eql('Sample classification text\nSample classification text 2\n');
					done();
				}
			});
			room.user.say('mimiron', '@hubot nlc data');
		});
	});

	describe('user asks for training data for a specific classifier', function() {
		it('should reply with slack attachment with current classifier data', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.message){
					expect(event.message).to.be.eql('NLC instance **cd02b5x110-nlc-0000** was trained with **2** classifications and **3** statements.');
				}
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql('Training Data for classifier ID cd02b5x110-nlc-0000');
					expect(event.attachments[0].fields).to.have.length(2);
					expect(event.attachments[0].fields[0].title).to.eql('classification');
					expect(event.attachments[0].fields[0].value).to.eql('Sample text\nSample text 2\n');
					done();
				}
			});
			room.user.say('mimiron', '@hubot nlc data classification cd02b5x110-nlc-0000');
		});
	});

	describe('user asks for classifier list', function() {
		it('should reply with slack attachment with list of classifers', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(2);
					expect(event.attachments[0].title).to.eql('test-classifier');
					expect(event.attachments[0].fields[0].value).to.eql('Available');
					expect(event.attachments[1].fields[0].value).to.eql('Training');
					done();
				}
			});
			room.user.say('mimiron', '@hubot nlc list');
		});
	});

	describe('user asks for nlc help', function() {
		it('should respond with help', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('nlc.help.status'));
					expect(event.message).to.contain(i18n.__('nlc.help.list'));
					expect(event.message).to.contain(i18n.__('nlc.help.train'));
					expect(event.message).to.contain(i18n.__('nlc.help.auto.approve'));
					expect(event.message).to.contain(i18n.__('nlc.help.data'));
					done();
				}
			});
			room.user.say('mimiron', '@hubot nlc help');
		});
	});

	describe('User starts a new training session', function(){
		it('should start training a new classifier', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.train.new.session'));
				done();
			});
			room.user.say('mimiron', 'hubot nlc train').then(() => {
				room.user.say('mimiron', 'yes');
			});
		});
	});

	describe('Test ENV setup', function(){
		before(function() {
			env.nlc_enabled = false;
		});
		after(function() {
			env.nlc_enabled = true;
		});

		it('should not process statement as NLC when environment is not set.', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.no.match'));
				done();
			});
			room.user.say('mimiron', '@hubot Can you process Natural Language?');
		});

		it('should not check status of classifier when environment is not set', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.train.not.configured'));
				done();
			});
			room.user.say('mimiron', '@hubot nlc status');
		});

		it('should not list classifiers when environment is not set', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.train.not.configured'));
				done();
			});
			room.user.say('mimiron', '@hubot nlc list');
		});

		it('should not auto approve when environment is not set', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.train.not.configured'));
				done();
			});
			room.user.say('mimiron', '@hubot nlc auto approve');
		});

		it('should not train classifier when environment is not set', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.train.not.configured'));
				done();
			});
			room.user.say('mimiron', '@hubot nlc train').then(() => {
				room.user.say('mimiron', 'yes');
			});
		});

		it('should not check classifier data when environment is not set', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.train.not.configured'));
				done();
			});
			room.user.say('mimiron', '@hubot nlc data');
		});
	});


	describe('Test NLC error path', function(){
		before(function(){
			mockNLP.setupMockErrors();
		});

		it('should fail gracefully when Watson NLC service has a 500 error.', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.error.unexpected.general'));
				done();
			});
			room.user.say('mimiron', '@hubot high confidence result');
		});

		it('should respond with an error when NLC training fails', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.message.indexOf(i18n.__('nlc.train.error')) >= 0) {
					done();
				}
			});
			room.user.say('mimiron', 'hubot nlc train').then(() => {
				room.user.say('mimiron', 'yes');
			});
		});
	});

	describe('Test NLC with empty classifier list', function(){
		before(function() {
			mockNLP.setupMockEmpty();
		});

		it('should prompt user to start training then handle negative response', function(done){
			room.user.say('mimiron', 'hubot nlc status').then(() => {
				room.user.say('mimiron', 'no');
				return sprinkles.eventually({ timeout: timeout }, function(){
					if (room.messages.length < 4){
						throw new Error('too soon');
					}
				}).then(() => false).catch(() => true).then((success) => {
					expect(room.messages.length).to.eql(4);
					expect(room.messages[1][1]).to.eql(`@mimiron ${i18n.__('nlc.status.prompt', 'test-classifier')}`);
					expect(room.messages[3][1]).to.eql(`@mimiron ${i18n.__('nlc.train.decline')}`);
					done();
				});
			});
		});

		it('should prompt user to start training then handle positive response', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.train.new.session'));
				done();
			});
			room.user.say('mimiron', 'hubot nlc status').then(() => {
				room.user.say('mimiron', 'yes');
			});
		});

		it('should respond with no classifiers to list message', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.list.no.classifiers'));
				done();
			});
			room.user.say('mimiron', 'hubot nlc list');
		});

	});

	describe('Test auto approve command', function(){
		it('should succesfully turn auto approve off', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.auto.approve.set', 'true'));
				done();
			});
			room.user.say('mimiron', 'hubot nlc auto approve on');
		});

		it('should respond with auto approve value', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.auto.approve.set', 'true'));
				done();
			});
			room.user.say('mimiron', 'hubot nlc auto approve');
		});
	});
});

describe('Test the NLC interaction with getEntities failure', function(){
	let room;
	let db;
	let badparamClassification = {
		text: 'medium confidence result',
		top_class: 'test.badparam.js',
		classes:
			[ { class_name: 'test.badparam.js', confidence: 0.5672086742164803 } ]
	};

	before(function() {
		mockNLP.setupMockery();
		return nlcDb.open().then((res) => {
			db = res;
			return db.put({
				// add class with description
				_id: 'test.badparam.js',
				description: 'Description for bad params class',
				emittarget: 'badparam.js',
				parameters: [
					{
						name: 'aname',
						type: 'entity',
						entityfunction: 'afunction'
					}
				]
			});
		});
	});

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});


	context('user says a statement', function() {
		it('should emit a medium classification event', function(done) {
			var replyFn = function(msg) {
				if (msg.includes('(1)')) {
					room.user.say('mimiron', '1');
				}
				else {
					done(new Error(`Unexpected dialog prompt [${msg}].`));
				}
			};
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.message.includes(i18n.__('nlc.error.entities', ''))) {
					done();
				}
			});
			var res = { message: {text: 'Medium confidence', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('nlc.confidence.med', res, badparamClassification);
		});

		it('should emit a high classification event', function(done) {
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.message.includes(i18n.__('nlc.error.entities', ''))) {
					done();
				}
			});
			var res = { message: {text: 'High confidence', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.confidence.high', res, badparamClassification);
		});
	});
});
