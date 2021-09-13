
import config from '../../config/config.json'
import { DatabaseAccessor } from './DatabaseAccessor'

export async function fetch(configurableOption : string):Promise<string> {
	const defaultValue = jsonResolve(config, configurableOption);

	var dbQueryResult = [];

	try {
		dbQueryResult = await new DatabaseAccessor(config.databaseLocation)
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

export async function set(configurableOption : string, value:string):Promise<void> {
	const sqlupdate = `
	UPDATE Config SET value='${value}' WHERE name='${configurableOption}';`;
	const sqlnew = `INSERT INTO Config (name, value) VALUES ('${configurableOption}', '${value}');`;
	const changes = await new DatabaseAccessor(config.databaseLocation)
	.runSQL(sqlupdate);

	if(changes == 0)
		await new DatabaseAccessor(config.databaseLocation)
		.execSQL(sqlnew);
}

async function jsonResolve(jsonObj:any, str:string) : Promise<string> {
	const parts = str.split('.');
	var tmp:any = jsonObj

	for(const part of parts) {
		tmp = tmp[part];
		if (tmp === undefined) {
			throw new Error("Option does not exist.");
		}
	}

	if(typeof tmp != "string"){
		throw new Error("Option does not exist.");
	}

	return tmp;
}
