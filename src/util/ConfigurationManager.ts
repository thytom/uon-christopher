import { DatabaseAccessor } from './DatabaseAccessor'

import fs from 'fs'

import {databaseLocation} from '../../config/private.json'

export class ConfigurationManager {

	private static configurationDirectory = '../../config/';

	private files:any;

	public constructor() {
		// Load all configuration files
		this.files = this.loadFiles();
	}

	private async loadFiles():Promise<any>{
		var files = {};
		const filenames = fs.readdirSync(ConfigurationManager.configurationDirectory)
		.filter(file => !file.endsWith('template.json')) // Filter out default files
		.map((f:String) => f.replace('.json', ''))
		for(const file of filenames) {
			files[file] = require(ConfigurationManager.configurationDirectory + file);
		}
		return files;
	}

	public async fetch(configurableOption:string, allowPrivate:boolean = false):Promise<string> {
		const defaultValue = jsonResolve(await this.files, configurableOption, allowPrivate);

		var dbQueryResult = [];

		try {
			dbQueryResult = await new DatabaseAccessor('../../' + databaseLocation)
			.querySQL(`SELECT * FROM Config WHERE name='${configurableOption}'`);
		} catch (err) {
			console.log("Error fetching from database: " + err);
		}

		if(dbQueryResult.length == 0) {
			return defaultValue;
		} else {
			return dbQueryResult[0].value;
		}
	}

	// TODO: 
	// 	- Set should only work on public values
	//  - Confirm a value actually exists before trying to set it
	public async set(configurableOption : string, value:string):Promise<void> {
		const sqlupdate = `
		UPDATE Config SET value='${value}' WHERE name='${configurableOption}';`;
		const sqlnew = `INSERT INTO Config (name, value) VALUES ('${configurableOption}', '${value}');`;
		const changes = await new DatabaseAccessor(databaseLocation)
		.runSQL(sqlupdate);

		if(changes == 0)
			await new DatabaseAccessor(databaseLocation)
			.execSQL(sqlnew);
	}

}

async function jsonResolve(jsonObj:any, str:string, allowPrivate:boolean = false) : Promise<string> {
	const parts = str.split('.');
	var tmp:any = jsonObj;

	var isPrivate:boolean = false;

	for(const part of parts) {
		if(!allowPrivate) {
			if(tmp[part]?.private === true) {
				isPrivate = true;
			}
		}
		if (tmp === undefined) {
			throw new Error("Option does not exist.");
		}
		tmp = tmp[part];
	}

	if(typeof tmp != "string"
	  && typeof tmp != "boolean"
	  && typeof tmp != "number"){
		throw new Error("Option does not exist.");
	}

	if(!allowPrivate
	  && isPrivate) {
		throw new Error("Public request for private option.");
	}

	return tmp.toString();
}
