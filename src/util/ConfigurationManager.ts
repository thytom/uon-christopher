
import config from '../../config/config.json'
import { DatabaseAccessor } from './DatabaseAccessor'

/** Class for managing configuration properties */
export class ConfigurationManager {

	public async fetch(configurableOption : string):Promise<string> {
		const defaultValue = ConfigurationManager.jsonResolve(config, configurableOption);

		const dbQueryResult = await new DatabaseAccessor(config.databaseLocation)
		.querySQL(`SELECT * FROM Config WHERE name='${configurableOption}'`);

		if(dbQueryResult.length == 0) {
			return defaultValue;
		} else {
			return dbQueryResult[0].value;
		}
	}

	public async set(configurableOption : string, value:string):Promise<void> {
		const sqlupdate = `
		UPDATE Config SET value='${value}' WHERE name='${configurableOption}';`;
		const sqlnew = `INSERT INTO Config (name, value) VALUES ('${configurableOption}', '${value}');`;
		const changes = await new DatabaseAccessor(config.databaseLocation)
		.runSQL(sqlupdate);

		if(changes == 0)
			await new DatabaseAccessor(config.databaseLocation)
			.execSQL(sqlnew);
	}

	private static async jsonResolve(jsonObj:any, str:string) : Promise<string> {
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
}

new ConfigurationManager().fetch('registerData.listenChannel')
.then(result => console.log(result))
.catch(err => console.log(err));

new ConfigurationManager().set('registerData.listenChannel', 'mentor-room')
.catch(err=>console.log(err))
