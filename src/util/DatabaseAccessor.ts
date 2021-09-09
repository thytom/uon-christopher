import sqlite3 from 'sqlite3'

// Time to wait before timing out.
const queryTimeout = 5;

// Singleton interface for accessing the sqlite database.
export class DatabaseAccessor {
	private db : sqlite3.Database;
	private static instance : DatabaseAccessor;
	private static available : boolean = true;

	private static sleep(ms : number) : Promise<void> {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}

	// Returns a db connection once it becomes available
	public static async awaitConnection(dbFilePath : string) : Promise<DatabaseAccessor> {
		var i = 0;
		while(!this.available) {
			await DatabaseAccessor.sleep(100);
			i++;
			if(i * 100 == 1000 * queryTimeout) {
				throw new Error("Database timeout.");
			}
		}
		this.available = false;
		this.instance = new DatabaseAccessor(dbFilePath);
		return this.instance;
	}

	private constructor(dbFilePath : string) {
		this.db = new sqlite3.Database(dbFilePath, (err) => {
			if(err) 
				throw err;
		});
	}

	/** Runs one query and provides the result */
	public querySQL(sql : string) : Promise<any[]> {
		return new Promise((resolve, reject) => {
			this.db.all(sql, (err, result) => {
				if(err) {
					reject(err);
				} else {
					resolve(result);
				}
			})
		});
	}

	/** Runs all queries with no result given */
	public execSQL(sql : string) : Promise<void>{
		return new Promise((resolve, reject) => {
			this.db.exec(sql, (err:Error) => {
				if(err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}


	public close() {
		console.log("Database connection closed.");
		this.db.close();
		DatabaseAccessor.closeConnection();
	}
	
	public static closeConnection() {
		this.available = true;
	}
}
