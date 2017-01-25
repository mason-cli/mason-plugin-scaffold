import {Mason,Command} from 'mason'

export class MasonScaffoldCommand extends Command {
	run(resolve, reject) {
		console.log('Scaffolding!');
		resolve();
	}
}

export default (Mason) => {
	Mason.registerCommand('scaffold', MasonScaffoldCommand);
};
