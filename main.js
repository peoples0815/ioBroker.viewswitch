'use strict';

/*
 * Created with @iobroker/create-adapter v2.0.2
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const fs = require("fs");
const adapterName    = require('./package.json').name.split('.').pop();
const dirPath        = '/opt/iobroker/iobroker-data/files/vis.0/';
const viewsJsonFile  = '/vis-views.json'
let adapter;

let viewFolder = 'Views';

let timerTout;
let i = 0;


class Viewswitch extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'viewswitch',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('message', this.onMessage.bind(this));

		// this.on('objectChange', this.onObjectChange.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// read existing Projects
	readProjects(){
		let projectList;
		let visProjects =[];
		let jsonFile = dirPath +'_data.json';
		
		if (fs.existsSync(jsonFile)) 
		{
			projectList = Object.keys(JSON.parse(fs.readFileSync(jsonFile, 'utf8')));
			for(i = 0; i < projectList.length; i++) {
				if(projectList[i].substring(projectList[i].length - 15).indexOf('/vis-views.json') != -1){
					visProjects.push(projectList[i].substring(0, (projectList[i].length - 15)));
				}
			}
			visProjects.sort();
			return(visProjects);
		} else {
			this.log.error('Cannot find ' + dirPath + this.config.visProject+'/vis-views.json');
		}
	}
	// generate existing Projects
	async generateProjectList(dirPath, viewsJsonFile)	{
		let projectList = '';
		try{
			fs.readdir(dirPath, (err, files) => { 
				if (err) 
					this.log.err(err); 
				else { 
					files.forEach(file => { 
						let isDirExists = fs.existsSync(dirPath + file) && fs.lstatSync(dirPath + file).isDirectory();
						if(isDirExists === true){
							if(fs.existsSync(dirPath + file + viewsJsonFile)){
								projectList += file+',';
								
							}
						}
					})
					this.setState('existingProjects', projectList.substring(0, projectList.length-1));
				}                             
			})
		} catch (e) {
			this.log.error(e);
		}				 
	}
	// read existing views
	readViews(project) { 
		if(project == '') project = 'main';
		let viewList;
			let jsonFile = dirPath + project +'/vis-views.json';
		if (fs.existsSync(jsonFile)) 
		{
			viewList = Object.keys(JSON.parse(fs.readFileSync(jsonFile, 'utf8')));
			viewList.shift();
			return(viewList);
		} else {
			this.log.error('Cannot find ' + dirPath + this.config.visProject+'/vis-views.json');
		}
	}


	/*******************************************************************************************************************************************************
	// Switch immediately to Wishview
	switchToViewImmediate(view){
		adapter.setForeignState('vis.0.control.instance', 'FFFFFFFF');
		adapter.setForeignState('vis.0.control.data', view);
		adapter.setForeignState('vis.0.control.command', 'changeView');
	}



	// Switch to configured Homeview
	async switchToHomeView() {
		try {
			const switchTimer = await adapter.getStateAsync('switchTimer');
			const lockViewActive = await adapter.getStateAsync('lockViewActive');
			const actualLockView = await adapter.getStateAsync('actualLockView');
			const actualHomeView = await adapter.getStateAsync('actualHomeView');
			const switchAutomatic = await adapter.getStateAsync('switchAutomatic');
			const visInstance = await adapter.getForeignStateAsync('vis.0.control.instance');
			if(switchAutomatic.val !== true){
					if(actualHomeView.val == ''){
						adapter.log.warning('!!!First define your HomeView!!!');
					} else {
						timerTout = await setTimeout(async function () {
							let timer = parseInt(switchTimer.val, 10)
							if(timer > 1){
								if(lockViewActive.val === true){
									if(timerTout) clearTimeout(timerTout);
									await adapter.setStateAsync('switchTimer', 0);
									if(actualLockView.val != actualLockView.val.split('/').pop()){
										switchToViewImmediate(adapter.config.visProject+'/'+actualLockView.val);
									}
								} else {
									await adapter.setStateAsync('switchTimer',timer - 1);
									switchToHomeView(); 
								}
							} else {
								await adapter.setStateAsync('switchTimer', 0);
								//if(visInstance.val === undefined) 
								await adapter.setForeignStateAsync('vis.0.control.instance', 'FFFFFFFF');
								await adapter.setForeignStateAsync('vis.0.control.data', adapter.config.visProject + '/' + actualHomeView.val);
								await adapter.setForeignStateAsync('vis.0.control.command', 'changeView');

							}
						}, 1000); 
					}
			}
		} catch (error) {
		adapter.log.error(error);
		}
	}

// Automatic switch the existing Views

//...... Not working yet 
// Timer läuft immer noch einmal durch

	autoSwitchView(i){
		try{
			let viewArr = readViews(adapter.config.visProject);
			const switchTimer = await adapter.getStateAsync('switchTimer');
			const switchAutomatic = await adapter.getStateAsync('switchAutomatic');
			const switchAutomaticTimer = await adapter.getStateAsync('switchAutomaticTimer');
			const actualHomeView = await adapter.getStateAsync('actualHomeView');

			if(switchAutomatic.val === true){
				if(i == '') i = 0;
				if(i < viewArr.length){
					const showIAV = await adapter.getStateAsync(viewFolder + '.' + viewArr[i]+'.'+'showIAV');
					if(showIAV.val === true){
						let timerAutoSV = await setTimeout(async function () {
							//if(switchTimer.val === 0 || switchTimer.val == '0') adapter.setState(switchTimer, switchAutomaticTimer.val)
							let timer = parseInt(switchTimer.val, 10);
							if (timer > 1) {
								await adapter.setStateAsync('switchTimer', timer -1);
								//await adapter.setStateAsync('switchAutomaticTimer', timer - 1);
								autoSwitchView(i);
							}
							else{
								await adapter.setStateAsync('switchTimer', switchAutomaticTimer.val);
								if(switchAutomatic.val === true) switchToViewImmediate(adapter.config.visProject+'/'+viewArr[i]);
								autoSwitchView((i+1));
							}
						}, 1000);
					} else {
						autoSwitchView((i+1));
						adapter.log.info('For this View AV is disabled')
					}
				} else {
					autoSwitchView(0);
					adapter.log.info('Jump back to first AutoView')
				}
			} else {
				if(timerAutoSV) clearTimeout(timerAutoSV);
				await adapter.setStateAsync(switchTimer, 0);
				switchToViewImmediate(adapter.config.visProject+'/'+actualHomeView.val);
			}
		} catch (error) {
			adapter.log.error(error);
		}
	}

*****************************************************************************************************************************************************************************************/	



	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		/*
		try {
		    //let result = this.readViews(this.config.visProject);//this.readViews('');
			//this.createObjects(result);
			//this.deleteVisObjects(this.readViews(this.config.visProject));
			//this.generateProjectList(dirPath, viewsJsonFile);
        } catch (error) {
			this.log.info(error); 
        }
		*/
		/*
		try {
			this.createObjects(dirPath, viewsJsonFile);
		} catch (error) {
			this.log.info(error);
		}
		*/
		 
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info('config option1: ' + this.config.option1);
		this.log.info('config option2: ' + this.config.option2);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  Anlegen von Datenpunkten
		/*
		await this.setObjectNotExistsAsync('actualHomeView', {
			type: 'state',
			common: {
				name: 'View what is set as Home',
				type: 'string',
				role: 'indicator',
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('existingProjects', {
			type: 'state',
			common: {
				name: 'List of existing Projects',
				type: 'string',
				role: 'indicator',
				read: true,
				write: true,
			},
			native: {},
		});
		*/
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		//this.subscribeStates('testVariable');
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates('lights.*');
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates('*');

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync('testVariable', true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync('testVariable', { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync('admin', 'iobroker');
		this.log.info('check user admin pw iobroker: ' + result);

		result = await this.checkGroupAsync('admin', 'admin');
		this.log.info('check group user admin group admin: ' + result);





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	}





	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	/*
	onMessage(obj) {
		if (typeof obj === 'object' && obj.message) {
			if (obj.command === 'send') {
				this.log.info('--------------------------------------------------------------------------------------------------')
				const visData = {}//new Object();
				
				visData.projectList = 'main'//this.readProjects();
				visData.viewList = this.readViews('main');//readViews(adapter.config.visProject);
				this.log.info(visData.viewList);
				this.log.info('--------------------------------------------------------------------------------------------------')
				
				// Send response in callback if required
				if (obj.callback) this.sendTo(obj.from, obj.command, visData, obj.callback);
			}
		}
   	}  
	*/
 	
	async onMessage(obj) {
        if (typeof obj === 'object' && obj.command) {
			const visData = {};
            switch (obj.command) {
                case 'send': {
                    try {
						visData.projectList =  this.readProjects();
						//visData.viewList = this.readViews(this.config.visProject);
                    }
                    catch (e) {
                        this.log.error(e);
                    }
                    this.sendTo(obj.from, obj.command, visData, obj.callback);
                    break;
                }
				case 'projects':{
					try {
						visData.projectList =  await this.readProjects();
                    }
                    catch (e) {
                        this.log.error(e);
                    }
                    this.sendTo(obj.from, obj.command, visData, obj.callback);
                    break;
				}
				case 'views':{
					try {
						this.log.info('current VIS-Project: ' + obj.message.config.visProject)
						visData.viewList =  await this.readViews(obj.message.config.visProject);
                    }
                    catch (e) {
                        this.log.error(e);
                    }
                    this.sendTo(obj.from, obj.command, visData, obj.callback);
                    break;
				}
            }
        }
    }
	

}


if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Viewswitch(options);
} else {
	// otherwise start the instance directly
	new Viewswitch();
}
