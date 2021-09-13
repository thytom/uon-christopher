import {DatabaseAccessor} from './DatabaseAccessor'

import * as ConfigurationManager from './ConfigurationManager';

export {setupDatabase, wipeRegister};

// CREATE TABLE IF NOT EXISTS RegisterConfig (
// 	entry VARCHAR(20) PRIMARY KEY,
// 	value VARCHAR(20) NOT NULL
// );

// Contains code for setting up the database.
const Init_SQL = `
CREATE TABLE IF NOT EXISTS Students (
	registerID 	INTEGER PRIMARY KEY,
	fullName 	VARCHAR(255) NOT NULL,
	discordID 	VARCHAR(255),
	roles 		TEXT DEFAULT 'Student'
);

CREATE TABLE IF NOT EXISTS Config (
	name VARCHAR(255) PRIMARY KEY,
	value TEXT NOT NULL
);
`;

function setupDatabase() {
	ConfigurationManager.fetch("databaseLocation")
	.then((dblocation:string) => {
		new DatabaseAccessor(dblocation).execSQL(Init_SQL);
	})
	.catch((err:Error) => {
		console.log("Error initialising database: " + err);
	});
}

/** DANGEROUS FUNCTION DO NOT RUN UNLESS YOU'RE SURE.
Wipes the entire student register*/
function wipeRegister() {
	ConfigurationManager.fetch("databaseLocation")
	.then((dblocation:string) => {
		new DatabaseAccessor(dblocation).execSQL("DELETE FROM Students")
	})
	.catch((err:Error) => {
		console.log("Error wiping database: " + err);
	});
}

module.exports = {
	setupDatabase,
	wipeRegister
}
