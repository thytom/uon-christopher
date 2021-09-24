import * as Discord from 'discord.js';
import fs from 'fs';
import StartupHookHandler from './util/StartupHookHandler'
import type {startupHook} from './util/StartupHookHandler'

import {ConfigurationManager} from './util/ConfigurationManager';

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

const startupHookHandler = new StartupHookHandler();
const localCommands = getLocalCommands();

type Command = {
	disable?:boolean, 									// Whether to disable the command outright
	name:string, 										// Name of the command
	description:string, 								// Description of the command
	options?:Discord.ApplicationCommandOption[], 		// List of options for the command
	defaultPermission:boolean, 							// Is this command available to everyone?
	lockToChannels:string[], 							// If [], can be run from any channel. If non-empty, channel specific
	permissions?:string[], 								// If defaultPermission is true, this acts as a blacklist. If false, this acts as a whitelist
	initHooks?: startupHook[],  						// Anything that needs to be done before the command is ready to use
	execute:(interaction: any, args?: any) => void 		// The command itself
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
	// guild.commands.set([]);
	// guild.commands.set(Array.from(commands.values()));
	// console.log("Command list:");
	// commands.forEach(cmd => {
	// 	console.log(`${cmd.name} - ${cmd.description}`);
	// });
	guild.commands.set([]); // Wipe commands
	commands.forEach(async (cmd) => {
		const command = await guild.commands.create(cmd);
		if(cmd.permissions) {
			const permissions : Discord.ApplicationCommandPermissionData[] = cmd.permissions.map(p => {
				const roleID = guild.roles.cache.find(r => r.name == p).id;
				return {
					id:roleID,
					type:'ROLE',
					permission:!cmd.defaultPermission,
				}
			})
			command.permissions.set({permissions});
		}
	});

	console.log("Updating command permissions...");
}

client.on('ready', async () => {
	console.log("Bot successfully connected.");
	const guild = client.guilds.cache.get(await (new ConfigurationManager()).fetch("serverInfo.serverID"));
	console.log("Listening to server: " + guild.name);

	console.log("Refreshing guild commands...");
	validateGuildCommands(guild, localCommands);

	console.log("Done.");
})

client.on('interactionCreate', async (interaction) => {
	if(!interaction.isCommand())
		return;

	const {commandName, options} = interaction;
	const cmd = localCommands.get(commandName);

	if(cmd && interaction.channel.type == 'GUILD_TEXT'
	  && (cmd.lockToChannels == [] || cmd.lockToChannels.includes(interaction.channel.name))) {
			cmd.execute(interaction, options);
	  } else {
		  interaction.reply({
			  content:"Sorry, you can't execute this here...",
			  ephemeral:true
		  });
	  }
})

console.log("Running pre-startup hooks...");
startupHookHandler.runStartupHooks();

(new ConfigurationManager()).fetch("private.auth.token", true).then(token => {
	client.login(token);
}).catch(err => {
	console.log("Could not login: " + err);
})

