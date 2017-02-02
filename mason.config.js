module.exports = {
	plugins: ['./lib/index.js'],
	scaffold: {
		templates: {
			'example': './example/in.txt'
		},
		definitions: {
			foo: 'ConfigForFoo'
		}
	}
};