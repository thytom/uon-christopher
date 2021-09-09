import * as Discord from 'discord.js';
import fs from 'fs';
import StartupHookHandler from './util/StartupHookHandler'
import type {startupHook} from './util/StartupHookHandler'

import config from '../config/config.json';

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

const startupHookHandler = new StartupHookHandler();
const localCommands = getLocalCommands();

type Command = {
	disable?:boolean,
	name:string,
	description:string,
	options?:Discord.ApplicationCommandOption[],
	initHooks?: startupHook[],
	execute:(interaction: any, args?: any) => void
};

export type {Command};

function getLocalCommands(): Discord.Collection<string, Command> {
	let commands = new Discord.Collection<string, Command>();

	fs.readdirSync(__dirname + '/commands')
	.filter(file => file.endsWith('.ts'))
	.forEach(file => {
		let command:Command = require(__dirname + '/commands/' + file).command;
		if(!command.disable) {
			//Do setup hooks
			for(const hook of command.initHooks) {
				startupHookHandler.addStartupHook(hook);
			}
			commands.set(command.name, command);
		}
	});

	return commands;
}

function validateGuildCommands(guild : Discord.Guild, commands: Discord.Collection<string, Command>) {
	// Clear all commands from guild
	guild.commands.set([]);
	guild.commands.set(Array.from(commands.values()));
	console.log("Command list:");
	commands.forEach(cmd => {
		console.log(`${cmd.name} - ${cmd.description}`);
	});
}

client.on('ready', async () => {
	console.log("Bot successfully connected.");
	const guild = client.guilds.cache.get(config.serverInfo.serverID);
	console.log("Listening to server: " + guild.name);

	console.log("Running pre-startup hooks...");
	startupHookHandler.runStartupHooks();
	console.log("Refreshing guild commands...");
	validateGuildCommands(guild, localCommands);

	console.log("Done.");
})

client.on('interactionCreate', async (interaction) => {
	if(!interaction.isCommand())
		return;

	const {commandName, options} = interaction;
	const cmd = localCommands.get(commandName)

	if(cmd) {
		cmd.execute(interaction, options);
	} 
})

client.login(config.auth.token);
