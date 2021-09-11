import {DatabaseAccessor} from './DatabaseAccessor'

import config from '../../config/config.json'

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
	new DatabaseAccessor(config.databaseLocation).execSQL(Init_SQL)
	.catch(err => {
		console.log("Error initialising database: " + err);
	});
}

/** DANGEROUS FUNCTION DO NOT RUN UNLESS YOU'RE SURE.
Wipes the entire student register*/
function wipeRegister() {
	new DatabaseAccessor(config.databaseLocation).execSQL("DELETE FROM Students")
	.catch(err => {
		console.log("Error wiping database: " + err);
	});
}

module.exports = {
	setupDatabase,
	wipeRegister
}
