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

describe('Test the NLC interaction', function(){
	let room;
	let db;

	before(function() {
		mockNLP.setupMockery();
		return nlcDb.open().then((res) => {
			db = res;
			// add class mapping for negative feedback testing
			return db.put({
				_id: 'nlc.feedback.negative',
				emittarget: 'nlc.feedback.negative.js'
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
			room.robot.on('nlc.confidence.low.js', (res, classification) => {
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
			room.robot.on('nlc.confidence.med.js', (res, classification) => {
				return sprinkles.eventually({ timeout: timeout }, function(){
					if (room.messages.length < 2){
						throw new Error('too soon');
					}
				}).then(() => false).catch(() => true).then((success) => {
					// reply with correct
					room.user.say('mimiron', '1');
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
			room.robot.on('nlc.confidence.med.js', (res, classification) => {
				return sprinkles.eventually({ timeout: timeout }, function(){
					if (room.messages.length < 2){
						throw new Error('too soon');
					}
				}).then(() => false).catch(() => true).then((success) => {
					// reply with incorrect
					room.user.say('mimiron', '2');

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
			room.robot.on('nlc.confidence.high.js', (res, classification) => {
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
				if (target.emitTarget === 'nlc.feedback.negative.js'){
					room.robot.emit('nlc.feedback.negative.js', res);
				}
			});

			room.robot.on('nlc.feedback.negative.js', (res) => {
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
});

describe('Test NLC error path', function(){
	var room;
	before(function(){
		mockNLP.setupMockErrors();
	});

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	it('should fail gracefully when Watson NLC service has a 500 error.', function(done){
		room.user.say('mimiron', 'hubot high confidence result').then(() => {
			return sprinkles.eventually({ timeout: timeout }, function(){
				if (room.messages.length < 2){
					throw new Error('too soon');
				}
			}).then(() => false).catch(() => true).then((success) => {
				expect(room.messages.length).to.eql(3);
				expect(room.messages[1][1]).to.eql('I\'m having trouble processing natural language requests.  If the problem persist contact your bot administrator.');
				expect(room.messages[2][1]).to.eql('In the meantime type `help` for a list of available commands.');
				done();
			});
		});
	});
});
