'use strict';

const { find, forEach, isEmpty, isFunction, isObject, isString } = require('lodash');
const Slackbot = require('slackbots');

function getReplyFunction (message, bot, emoji) {
	if (isDirectMessage(message)) {
		let sender = find(bot.users, user => user.id === message.user);
		return function (str) {
			bot.postMessageToUser(sender.name, str, { icon_emoji: emoji });
		};
	} else {
		let channel = find(bot.channels, channel => channel.id === message.channel);
		return function (str) {
			bot.postMessageToChannel(channel.name, str, { icon_emoji: emoji });
		};
	}
}

function getWelcomeFunction (bot, emoji) {
	return function (str) {
		forEach(bot.channels, (channel) => {
			if (channel.is_member) {
				bot.postMessageToChannel(channel.name, str, { icon_emoji: emoji });
			}
		});
	};
}

function getTrigger (message) {
	return isString(message.text) && message.text[0] === '!' && message.text.split(' ')[0].substring(1);
}

function isChatMessage (message) {
	return message.type === 'message' && !!message.text;
}

function isChannelConversation (message) {
	return isString(message.channel) && message.channel[0] === 'C';
}

function isDirectMessage (message) {
	return isString(message.channel) && message.channel[0] === 'D';
}

function isMessageFromBot (message, bot) {
	return message.username === bot.name || !!message.bot_id || message.subtype === 'bot_message';
}

function messageIsMentioningBot (message, bot) {
	return message.text.toLowerCase().indexOf(bot.name.toLowerCase()) > -1 || message.text.toLowerCase().indexOf(`@${bot.self.id.toLowerCase()}`) > -1;
}

function messageIsToBot (message, bot) {
	return bot.ims.filter(im => im.id === message.channel).length;
}



function SimpleSlackbot(name, token, emoji, hooks, triggers) {

	this.bot = new Slackbot({
		name,
		token
	});

	this.emoji = emoji || ':robot_face:';
	this.hooks = hooks || {};
	this.triggers = triggers || {};
}

SimpleSlackbot.prototype.run = function () {
	this.bot.on('start', () => {
		if (isObject(this.hooks) && !isEmpty(this.hooks) && isFunction(this.hooks.onStart)) {
			this.hooks.onStart(getWelcomeFunction(this.bot));
		}
	});
	this.bot.on('message', (message) => {
		if (isChatMessage(message) && !isMessageFromBot(message, this.bot)) {
			if (isChannelConversation(message) && messageIsMentioningBot(message, this.bot)) {
				if (isObject(this.hooks) && !isEmpty(this.hooks) && isFunction(this.hooks.onChannelMention)) {
					let fromUser = find(this.bot.users, user => user.id === message.user);
					this.hooks.onChannelMention(getReplyFunction(message, this.bot, this.emoji), message, fromUser);
				}
			} else if (isDirectMessage(message) && messageIsToBot(message, this.bot)) {
				if (isObject(this.hooks) && !isEmpty(this.hooks) && isFunction(this.hooks.onDirectMessage)) {
					let fromUser = find(this.bot.users, user => user.id === message.user);
					this.hooks.onDirectMessage(getReplyFunction(message, this.bot, this.emoji), message, fromUser);
				}
			} else if (isDirectMessage(message) && messageIsMentioningBot(message, this.bot)) {
				// This should never be caught, but it's here just in case.
				if (isObject(this.hooks) && !isEmpty(this.hooks) && isFunction(this.hooks.onDirectMessageMention)) {
					let fromUser = find(this.bot.users, user => user.id === message.user);
					this.hooks.onDirectMessageMention(getReplyFunction(message, this.bot, this.emoji), message, fromUser);
				}
			}
		}

		if (isObject(this.triggers) && !isEmpty(this.triggers)) {
			let trigger = getTrigger(message);
			if (trigger) {
				if (isFunction(this.triggers[trigger]) && isChatMessage(message)) {
					this.triggers[trigger](getReplyFunction(message, this.bot, this.emoji), message);
				}
			}
		}
	});
};

module.exports = SimpleSlackbot;
