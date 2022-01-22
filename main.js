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
			this.log.error('Cannot find ' + dirPath + adapter.config.visProject+'/vis-views.json');
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
			this.log.error('Cannot find ' + dirPath + adapter.config.visProject+'/vis-views.json');
		}
	}


	// Create not existing Objects
	createObjects(arr){
		let startHomeView;
////////////////////////////////////		
		for(let i=0; i<arr.length;i++){
			this.setObjectNotExistsAsync(viewFolder, {
				type: 'folder',
				native: {},
			});
			this.setObjectNotExistsAsync(viewFolder + '.' + arr[i], {
				type: 'folder',
				native: {},
			});
			this.setObjectNotExistsAsync(viewFolder + '.' + arr[i] + '.showIAV', {
				type: 'state',
				common: {
					name: 'View is shown in Autoview',
					type: 'boolean',
					def:  true,
					role: 'value',
					read: true,
					write: true,
				},
				native: {},
			});
			
			this.setObjectNotExistsAsync(viewFolder + '.' + arr[i] + '.sWSec', {
				type: 'state',
				common: {
					name: 'Time this View is shown',
					type: 'number',
					def:  25,
					role: 'value',
					read: true,
					unit:  's',
					write: true,
				},
				native: {},
			});
			this.setObjectNotExistsAsync(viewFolder + '.' + arr[i] + '.isLockView', {
				type: 'state',
				common: {
					name: 'View to be shown if lock is active',
					type: 'boolean',
					def:  false,
					role: 'value',
					read: true,
					write: true,
				},
				native: {},
			});
			this.setObjectNotExistsAsync(viewFolder + '.' + arr[i] + '.isHomeView', {
				type: 'state',
				common: {
					name: 'Homeview of Project',
					type: 'boolean',
					def:  i===0?true:false,
					role: 'value',
					read: true,
					write: true,
				},
				native: {},
			});
			if(i===0){startHomeView = arr[i]}
		};
		this.setObjectNotExistsAsync('actualHomeView', {
			type: 'state',
			common: {
				name: 'View what is set as Home',
				type: 'string',
				role: 'value',
				def:  startHomeView,
				read: true,
				write: true,
			},
			native: {},
		});
		this.setObjectNotExistsAsync('actualLockView', {
			type: 'state',
			common: {
				name: 'View what is set as Lockview',
				type: 'string',
				role: 'value',
				def:  '',
				read: true,
				write: true,
			},
			native: {},
		});
		this.setObjectNotExistsAsync('lockViewActive', {
			type: 'state',
			common: {
				name: 'Forces Lockview to be shown',
				type: 'boolean',
				def:  false,
				role: 'value',
				read: true,
				write: true,
			},
			native: {},
		});
		this.setObjectNotExistsAsync('switchAutomatic', {
			type: 'state',
			common: {
				name: 'Automatic change Views',
				type: 'boolean',
				def:  false,
				role: 'value',
				read: true,
				write: true,
			},
			native: {},
		});
		this.setObjectNotExistsAsync('switchAutomaticTimer', {
			type: 'state',
			common: {
				name: 'Timer for automatic View Change',
				type: 'number',
				role: 'value',
				def:  0,
				read: true,
				unit: 's',
				write: true,
			
			},
			native: {},
		});
		this.setObjectNotExistsAsync('switchTimer', {
			type: 'state',
			common: {
				name: 'Time to show actual View',
				type: 'number',
				role: 'value',
				def:  0,
				read: true,
				unit: 's',
				write: true,
			},
			native: {},
		});
		this.setObjectNotExistsAsync('existingProjects', {
			type: 'state',
			common: {
				name: 'List of existing Projects',
				type: 'string',
				role: 'value',
				read: true,
				write: true,
			},
			native: {},
		});
	}


	



	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		
		try {
		    let result = this.readViews(this.config.visProject);//this.readViews('');
			this.createObjects(result);
			this.generateProjectList(dirPath, viewsJsonFile);
        } catch (error) {
			this.log.info(error); 
        }
		
		
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
						visData.projectList =  await this.readProjects();
						visData.viewList = await this.readViews(this.config.visProject);
                    }
                    catch (e) {
                        this.log.error(e);
                    }
                    this.sendTo(obj.from, obj.command, visData, obj.callback);
                    break;
                }
				case 'getProjectList':{
					try {
						visData.projectList =  await this.readProjects();
                    }
                    catch (e) {
                        this.log.error(e);
                    }
                    this.sendTo(obj.from, obj.command, visData, obj.callback);
                    break;
				}
				case 'getProjectViews':{
					try {
						visData.viewList =  await this.readViews(this.config.visProject);
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