export type startupHook = () => void;

/* Responsible for calling any pre-requisite code
before commands are actually able to be called.
*/
export default class StartupHookHandler {
	private static instance:StartupHookHandler = null;
	private hooks : startupHook[] = [];

	public static getInstance() : StartupHookHandler {
		if(StartupHookHandler.instance == null) {
			StartupHookHandler.instance = new StartupHookHandler();
		}
		var r = StartupHookHandler.instance;
		return r;
	}

	public addStartupHook(hook : startupHook) {
		if(!this.hooks.includes(hook)) {
			this.hooks.push(hook);
		}
	}

	public runStartupHooks() {
		for(const hook of this.hooks)
			try {
				hook();
			} catch(e) {
				console.error(`Transaction hook ${hook} failed:\n` + e);
				process.exit(1);
			}
	}
}
