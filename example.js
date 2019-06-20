'use strict';

const SimpleSlackbot = require('simple-slackbot');

let name = 'kevbot';
let token = process.env.token || '123456';
let emoji = ':kevbot:';
let hooks = {
	onChannelMention: function (reply, message, fromUser) {
		reply(`It's bouncing around the Web like a beachball at a Nickelback concert.`);
	},
	onDirectMessage: function (reply, message, fromUser) {
		reply(`I'm pretty sure I've partied before, ${fromUser.name}.`);
	},
	onStart: function (reply) {
		reply(`Kevbot is back online.`); // All channels bot is a member of
	}
};
let triggers = {
	'action': function (reply, message) {
		reply('You just typed !action');
	}
};

let kevbot = new SimpleSlackbot(name, token, emoji, hooks, triggers);
kevbot.run();
