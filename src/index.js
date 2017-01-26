import {Command} from 'mason.cli'
import fs from 'fs'

class ScaffoldUtil {
	static registerConfigTemplates(command) {
		let conf = this.getConf(command);
		let templates = command.runner.data.get('scaffold.templates');

		// Register config templates on top of any plugin templates
		if(conf.hasOwnProperty('templates') && typeof conf.templates == 'object') {
			let conf_templates = new Map(Object.entries(conf.templates));
			conf_templates.forEach((location, name) => {
				templates.set(name, location);
			});
		}
	}

	static getConf(command) {
		return command.conf.hasOwnProperty('scaffold') ? command.conf.scaffold : {};
	}
}

class MasonScaffoldCommand extends Command {
	/**
	 * Read & replace template buffer
	 * @param  {string} template Template Name
	 * @return {string}          Replaced template buffer
	 */
	prepareTemplate(template) {
		let templates = this.runner.data.get('scaffold.templates');
		if(!templates.has(template)) {
			throw "Invalid template requested: " + template;
		}

		let filename = templates.get(template);
		if(!fs.existsSync(filename)) {
			throw "Invalid template path '" + filename + "' for '" + template + "'";
		}

		let conf = ScaffoldUtil.getConf(this);
		let replacements = new Map(Object.entries(this.input.options));
		let var_prefix = conf.hasOwnProperty('var_prefix') ? conf.var_prefix : '@@{';
		let var_suffix = conf.hasOwnProperty('var_suffix') ? conf.var_suffix : '}@@';

		let buffer = fs.readFileSync(filename) + '';
		replacements.forEach((replacement, original) => {
			console.info(' - Replacing ' + var_prefix + original + var_suffix + ' with ' + replacement);
			buffer = buffer.replace(var_prefix + original + var_suffix, replacement);
		});

		return buffer;
	}

	/**
	 * Execute the scaffold command
	 * @param  {function} resolve Successfully complete the command
	 * @param  {function} reject  Reject the command promise (error out)
	 * @return {void}
	 */
	run(resolve, reject) {
		if(this.input.args.length) {
			// Register configuration templates
			ScaffoldUtil.registerConfigTemplates(this);

			let template = this.input.args[0];
			let destination = this.input.args[1];
			if(!template || !destination) {
				throw "Usage: mason scaffold [template] [destination] [--var=val]";
			}

			let templates = this.runner.data.get('scaffold.templates');
			if(templates.has(template)) {
				// Attempt to open a write stream to the destination
				fs.open(destination, 'wx', (err, fd) => {
					if(err) {
						if(err.code == "EEXIST") {
							console.error("The file '" + destination + "' already exists.");
						} else {
							throw err;
						}
					} else {
						// We have a valid write stream, parse the template
						let buffer = this.prepareTemplate(template);
						fs.write(fd, buffer, (err, written, buffer) => {
							if(err) {
								throw err;
							} else {
								console.info('Template "' + template + '" written to "' + destination + '"');
								resolve();
							}
						});
					}
				});
			} else {
				console.error('Invalid template requested: ' + template);
			}
		} else {
			reject('What do you want to scaffold?');
		}
		resolve();
	}
}

class MasonScaffoldLSCommand extends Command {
	run(resolve, reject) {
		ScaffoldUtil.registerConfigTemplates(this);

		console.log('Mason Templates');
		console.log('---------------------------');
		let templates = this.runner.data.get('scaffold.templates');
		templates.forEach((location, name) => {
			console.info(' + ' + name + ': ' + location);
		});
		console.log('---------------------------');
	}
}

/**
 * Plugin bootstrap method
 * @param  {Mason} Mason The Mason CLI instance
 * @return {void}
 */
export default (Mason) => {
	// Register the scaffold command with Mason
	Mason.registerCommand('scaffold', MasonScaffoldCommand);
	Mason.registerCommand('scaffold-ls', MasonScaffoldLSCommand);

	// Create a template store
	Mason.data.set('scaffold.templates', new Map());

	// Allow registration of scaffold templates from other plugins
	Mason.on('addScaffoldTemplate', (opt) => {
		if(opt.hasOwnProperty('name') && opt.hasOwnProperty('location')) {
			Mason.data.get('scaffold.templates').set(opt.name, opt.location);
		} else {
			console.error('Unable to register scaffold template. Invalid name or location.', opt);
		}
	});
};
