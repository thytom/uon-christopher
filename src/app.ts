import * as Discord from 'discord.js';
import fs from 'fs';

import config from '../config/config.json';

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

const localCommands = getLocalCommands();

type Command = {
	name:string,
	description:string,
	options?:any,
	execute:(interaction: any, args?: any) => void
};

function getLocalCommands(): Discord.Collection<string, Command> {
	let commands = new Discord.Collection<string, Command>();

	const commandFiles:string[] = fs.readdirSync(__dirname + '/commands')
						   			.filter(file => file.endsWith('.ts'));

	for(const file of commandFiles) {
		let command:Command = require(__dirname + '/commands/' + file).command;
		commands.set(command.name, command);
	}

	return commands;
}

function validateGuildCommands(guild : Discord.Guild, commands: Discord.Collection<string, Command>) {
	// Clear all commands from guild
	guild.commands.set([]);
	console.log("Removed previous commands.");

	guild.commands.set(Array.from(commands.values()));
	console.log("Added new command list: ");
	commands.forEach(cmd => {
		console.log(`${cmd.name} - ${cmd.description}`);
	});
}

client.on('ready', async () => {
	console.log("Bot is connected.");
	const guild = client.guilds.cache.get(config.serverInfo.serverID);
	console.log("Listening to server: " + guild.name);
	validateGuildCommands(guild, localCommands);
})

client.on('interactionCreate', async (interaction) => {
	if(!interaction.isCommand()) {
		return;
	}

	const {commandName, options} = interaction;

	const cmd = localCommands.get(commandName)

	if(cmd) {
		cmd.execute(interaction, options);
	} 
})

client.login(config.auth.token);

export type {Command};
