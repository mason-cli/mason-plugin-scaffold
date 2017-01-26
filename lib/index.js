'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mason = require('mason.cli');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScaffoldUtil = function () {
	function ScaffoldUtil() {
		_classCallCheck(this, ScaffoldUtil);
	}

	_createClass(ScaffoldUtil, null, [{
		key: 'registerConfigTemplates',
		value: function registerConfigTemplates(command) {
			var conf = this.getConf(command);
			var templates = command.runner.data.get('scaffold.templates');

			// Register config templates on top of any plugin templates
			if (conf.hasOwnProperty('templates') && _typeof(conf.templates) == 'object') {
				var conf_templates = new Map(Object.entries(conf.templates));
				conf_templates.forEach(function (location, name) {
					templates.set(name, location);
				});
			}
		}
	}, {
		key: 'getConf',
		value: function getConf(command) {
			return command.conf.hasOwnProperty('scaffold') ? command.conf.scaffold : {};
		}
	}]);

	return ScaffoldUtil;
}();

var MasonScaffoldCommand = function (_Command) {
	_inherits(MasonScaffoldCommand, _Command);

	function MasonScaffoldCommand() {
		_classCallCheck(this, MasonScaffoldCommand);

		return _possibleConstructorReturn(this, (MasonScaffoldCommand.__proto__ || Object.getPrototypeOf(MasonScaffoldCommand)).apply(this, arguments));
	}

	_createClass(MasonScaffoldCommand, [{
		key: 'prepareTemplate',

		/**
   * Read & replace template buffer
   * @param  {string} template Template Name
   * @return {string}          Replaced template buffer
   */
		value: function prepareTemplate(template) {
			var templates = this.runner.data.get('scaffold.templates');
			if (!templates.has(template)) {
				throw "Invalid template requested: " + template;
			}

			var filename = templates.get(template);
			if (!_fs2.default.existsSync(filename)) {
				throw "Invalid template path '" + filename + "' for '" + template + "'";
			}

			var conf = ScaffoldUtil.getConf(this);
			var replacements = new Map(Object.entries(this.input.options));
			var var_prefix = conf.hasOwnProperty('var_prefix') ? conf.var_prefix : '@@{';
			var var_suffix = conf.hasOwnProperty('var_suffix') ? conf.var_suffix : '}@@';

			var buffer = _fs2.default.readFileSync(filename) + '';
			replacements.forEach(function (replacement, original) {
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

	}, {
		key: 'run',
		value: function run(resolve, reject) {
			var _this2 = this;

			if (this.input.args.length) {
				(function () {
					// Register configuration templates
					ScaffoldUtil.registerConfigTemplates(_this2);

					var template = _this2.input.args[0];
					var destination = _this2.input.args[1];
					if (!template || !destination) {
						throw "Usage: mason scaffold [template] [destination] [--var=val]";
					}

					var templates = _this2.runner.data.get('scaffold.templates');
					if (templates.has(template)) {
						// Attempt to open a write stream to the destination
						_fs2.default.open(destination, 'wx', function (err, fd) {
							if (err) {
								if (err.code == "EEXIST") {
									console.error("The file '" + destination + "' already exists.");
								} else {
									throw err;
								}
							} else {
								// We have a valid write stream, parse the template
								var buffer = _this2.prepareTemplate(template);
								_fs2.default.write(fd, buffer, function (err, written, buffer) {
									if (err) {
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
				})();
			} else {
				reject('What do you want to scaffold?');
			}
			resolve();
		}
	}]);

	return MasonScaffoldCommand;
}(_mason.Command);

var MasonScaffoldLSCommand = function (_Command2) {
	_inherits(MasonScaffoldLSCommand, _Command2);

	function MasonScaffoldLSCommand() {
		_classCallCheck(this, MasonScaffoldLSCommand);

		return _possibleConstructorReturn(this, (MasonScaffoldLSCommand.__proto__ || Object.getPrototypeOf(MasonScaffoldLSCommand)).apply(this, arguments));
	}

	_createClass(MasonScaffoldLSCommand, [{
		key: 'run',
		value: function run(resolve, reject) {
			ScaffoldUtil.registerConfigTemplates(this);

			console.log('Mason Templates');
			console.log('---------------------------');
			var templates = this.runner.data.get('scaffold.templates');
			templates.forEach(function (location, name) {
				console.info(' + ' + name + ': ' + location);
			});
			console.log('---------------------------');
		}
	}]);

	return MasonScaffoldLSCommand;
}(_mason.Command);

/**
 * Plugin bootstrap method
 * @param  {Mason} Mason The Mason CLI instance
 * @return {void}
 */


exports.default = function (Mason) {
	// Register the scaffold command with Mason
	Mason.registerCommand('scaffold', MasonScaffoldCommand);
	Mason.registerCommand('scaffold-ls', MasonScaffoldLSCommand);

	// Create a template store
	Mason.data.set('scaffold.templates', new Map());

	// Allow registration of scaffold templates from other plugins
	Mason.on('addScaffoldTemplate', function (opt) {
		if (opt.hasOwnProperty('name') && opt.hasOwnProperty('location')) {
			Mason.data.get('scaffold.templates').set(opt.name, opt.location);
		} else {
			console.error('Unable to register scaffold template. Invalid name or location.', opt);
		}
	});
};