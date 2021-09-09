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
	role 		VARCHAR(255) DEFAULT 'Student'
);
`;

function setupDatabase() {
	DatabaseAccessor.awaitConnection(config.databaseLocation)
	.then(db => {
		db.execSQL(Init_SQL);
		db.close();
	});
}

/** DANGEROUS FUNCTION DO NOT RUN UNLESS YOU'RE SURE.
Wipes the entire student register*/
function wipeRegister() {
	DatabaseAccessor.awaitConnection(config.databaseLocation)
	.then(db => {
		db.execSQL("DELETE FROM Students");
		db.close();
	}).catch(err => {
		console.log(err);
	})
}

module.exports = {
	setupDatabase,
	wipeRegister
}
