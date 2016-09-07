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
const mockUtils = require('./nlc.mock');
const nlcDb = require('hubot-ibmcloud-cognitive-lib').nlcDb;

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

describe('Interacting with NLC commands via Natural Language', function() {
	let room;
	let db;

	before(function() {
		mockUtils.setupMockery();
		return nlcDb.open().then((res) => {
			db = res;
			// add classifier data for current classifier, only if it hasn't been added. Data may exist if nlc.tests runs first.
			return db.get('cd02b5x110-nlc-5103').catch(() => {
				return db.put({
					_id: 'cd02b5x110-nlc-5103',
					type: 'classifier_data',
					trainedData: 'Sample classification text,classification\nSample classification text 2,classification\nSample classification text 3,classification3'
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

	context('user asks for classifier status', function() {
		it('should reply with slack attachment with available classifier', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql('test-classifier');
					expect(event.attachments[0].fields[0].value).to.eql('Available');
					done();
				}
			});
			let res = { message: {text: 'status of my classifier', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.status', res, {});
		});
	});

	context('user asks for classifier list', function() {
		it('should reply with slack attachment with list of classifiers', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(2);
					expect(event.attachments[0].title).to.eql('test-classifier');
					expect(event.attachments[0].fields[0].value).to.eql('Available');
					expect(event.attachments[1].fields[0].value).to.eql('Training');
					done();
				}
			});
			let res = { message: {text: 'list my classifiers', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.list', res, {});
		});
	});

	context('user asks for classifier data', function() {
		it('should reply with slack attachment with classifier data', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql(i18n.__('nlc.data.title'));
					expect(event.attachments[0].fields.length).to.eql(2);
					expect(event.attachments[0].fields[0].title).to.eql('classification');
					expect(event.attachments[0].fields[0].value).to.eql('Sample classification text\nSample classification text 2\n');
					done();
				}
			});
			let res = { message: {text: 'data for my classifier', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.data', res, {});
		});
	});

	context('user asks for nlc help', function() {
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

			let res = { message: {text: 'help with nlc', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.management.help', res, {});
		});
	});

	context('user asks for general help', function() {
		it('should respond with help', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('nlc.help'));
					done();
				}
			});

			let res = { message: {text: 'I need some help', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.help', res, {});
		});
	});

	context('user toggles auto approve', function(){
		it('should succesfully turn auto approve off', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.auto.approve.set', 'true'));
				done();
			});
			let res = { message: {text: 'turn auto approve off', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.auto.approve', res, { autoapprove: 'on' });
		});

		it('should respond with auto approve value', function(done){
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('nlc.auto.approve.set', 'true'));
				done();
			});
			let res = { message: {text: 'auto approve setting', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('nlc.auto.approve', res, {});
		});
	});
});
