import 'discord.js';
import type {Command} from '../app'

const command : Command = {
	name: 'hw',
	description: 'Prints "Hello, World!"',
	execute: (interaction) => {
		interaction.reply({
			content: "Hello, World!",
			ephemeral: true,
		})
	}
}

module.exports = {
	command
};
