import {Mason,Command} from 'mason'

export default class MasonScaffoldCommand extends Command {
	run(resolve, reject) {
		console.log('Scaffolding!');
	}
}
Mason.registerCommand('scaffold', MasonScaffoldCommand);