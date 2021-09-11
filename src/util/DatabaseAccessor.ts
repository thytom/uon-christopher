import sqlite3 from 'sqlite3'

// Performs all queries
export class DatabaseAccessor {

	private dbFilePath:string;

	public constructor(dbFilePath:string) {
		this.dbFilePath = dbFilePath;
	}

	querySQL(sql:string) : Promise<any[]> {
		return new Promise((resolve, reject) => {
			const db = new sqlite3.Database(this.dbFilePath, (err : Error) => {
				if(err)
					reject(err);
			});
			db.all(sql, (err : Error, rows : any[]) => {
				if(err) { 
					reject(err); 
				} else 	{
					resolve(rows);
				}
			}).close();
		})
	}

	runSQL(sql:string) : Promise<number> {
		return new Promise((resolve, reject) => {
			const db = new sqlite3.Database(this.dbFilePath, (err : Error) => {
				if(err)
					reject(err);
			});
			db.run(sql, function (err : Error) {
				if(err) {
					reject(err);
				} else {
					resolve(this.changes);
				}
			}).close();
		})
	}

	execSQL(sql:string) : Promise<void> {
		return new Promise((resolve, reject) => {
			const db = new sqlite3.Database(this.dbFilePath, (err : Error) => {
				if(err)
					reject(err);
			});
			db.exec(sql, (err : Error) => {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			}).close();
		})
	}
}
