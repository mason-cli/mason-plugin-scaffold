import {Mason,Command} from 'mason'

export class MasonScaffoldCommand extends Command {
	run(resolve, reject) {
		console.log('Scaffolding!');
	}
}

export default (Mason) => {
	Mason.registerCommand('scaffold', MasonScaffoldCommand);
};