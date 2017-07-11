"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mason = require("mason.cli");

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _lodash = require("lodash");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ScaffoldUtil = function () {
    function ScaffoldUtil() {
        _classCallCheck(this, ScaffoldUtil);
    }

    _createClass(ScaffoldUtil, null, [{
        key: "registerConfigTemplates",
        value: function registerConfigTemplates(command) {
            var templates = command.runner.data.get("scaffold.templates");
            var conf = command.conf.scaffold || {};

            // Register config templates on top of any plugin templates
            if (conf.hasOwnProperty("templates") && _typeof(conf.templates) == "object") {
                var conf_templates = new Map(Object.entries(conf.templates));
                conf_templates.forEach(function (location, name) {
                    templates.set(name, location);
                });
            }
        }
    }, {
        key: "getConf",
        value: function getConf() {}
    }]);

    return ScaffoldUtil;
}();

var MasonScaffoldCommand = function (_Command) {
    _inherits(MasonScaffoldCommand, _Command);

    function MasonScaffoldCommand(runner) {
        _classCallCheck(this, MasonScaffoldCommand);

        var _this = _possibleConstructorReturn(this, (MasonScaffoldCommand.__proto__ || Object.getPrototypeOf(MasonScaffoldCommand)).call(this));

        _this.conf = {};
        _this.runner = false;
        _this.input = false;

        _this.runner = runner;
        return _this;
    }

    /**
     * Read & replace template buffer
     * @param  {string} template Template Name
     * @return {string}          Replaced template buffer
     */


    _createClass(MasonScaffoldCommand, [{
        key: "prepareTemplate",
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(template) {
                var templates, templateValue, filename, conf, var_prefix, var_suffix, buffer, interactive, defaultValues, replacements, prefix_match, suffix_match, match_txt, parts, self, varName;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                templates = this.runner.data.get("scaffold.templates");

                                if (templates.has(template)) {
                                    _context.next = 3;
                                    break;
                                }

                                throw "Invalid template requested: " + template;

                            case 3:
                                templateValue = templates.get(template);
                                filename = void 0;

                                if ((typeof templateValue === "undefined" ? "undefined" : _typeof(templateValue)) == "object") {
                                    filename = templateValue.source;
                                } else {
                                    filename = templateValue;
                                }

                                if (_fs2.default.existsSync(filename)) {
                                    _context.next = 8;
                                    break;
                                }

                                throw "Invalid template path '" + filename + "' for '" + template + "'";

                            case 8:
                                conf = this.conf.hasOwnProperty("scaffold") ? this.conf.scaffold : {};
                                var_prefix = conf.hasOwnProperty("var_prefix") ? conf.var_prefix : "@@{";
                                var_suffix = conf.hasOwnProperty("var_suffix") ? conf.var_suffix : "}@@";
                                buffer = _fs2.default.readFileSync(filename) + "";
                                interactive = this.input.flags.indexOf("interactive") !== -1 || this.input.flags.indexOf("i") !== -1;


                                console.log("Interactive", interactive);
                                defaultValues = conf.definitions ? conf.definitions : {};
                                replacements = new Map(Object.entries(defaultValues));

                                if (interactive) {
                                    prefix_match = (var_prefix + "").replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
                                    suffix_match = (var_suffix + "").replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
                                    match_txt = new RegExp(prefix_match + "([^ ]+)" + suffix_match, "g");
                                    parts = buffer.match(match_txt);
                                    self = this;

                                    console.log("When prompted, please provide a replacement for the following variables:");
                                    parts.forEach(function (part) {
                                        var variable = (part + "").replace(var_prefix, "").replace(var_suffix, "");
                                        var defaultValue = replacements.has(variable) ? replacements.get(variable) : "";
                                        var value = self.runner.prompt(" > " + variable + '    (default: "' + defaultValue + '"):' + "\t");
                                        replacements.set(variable, value ? value : defaultValue);
                                    });
                                } else {
                                    if (this.input.options) {
                                        try {
                                            this.input.options.forEach(function (word, replacement) {
                                                replacements.set(word, replacement);
                                            });
                                        } catch (e) {
                                            for (varName in this.input.options) {
                                                if (this.input.options.hasOwnProperty(varName)) {
                                                    replacements.set(varName, this.input.options[varName]);
                                                }
                                            }
                                        }
                                    }
                                }
                                replacements.forEach(function (replacement, original) {
                                    console.info(" - Replacing " + var_prefix + original + var_suffix + " with " + replacement);
                                    buffer = buffer.replace("" + var_prefix + original + var_suffix, replacement);
                                });

                                return _context.abrupt("return", buffer);

                            case 19:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function prepareTemplate(_x) {
                return _ref.apply(this, arguments);
            }

            return prepareTemplate;
        }()

        /**
         * Execute the scaffold command
         * @param  {object} input       The Mason input object
         * @param  {object} config      The Mason config object
         * @return {void}
         */

    }, {
        key: "run",
        value: function () {
            var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(input, conf) {
                var _this2 = this;

                var template, destination, templates, flags, withTemplate, templateObj, _conf, destination_prefix, fd;

                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                this.conf = conf;
                                this.input = input;

                                if (!input.args.length) {
                                    _context3.next = 33;
                                    break;
                                }

                                // Register configuration templates
                                ScaffoldUtil.registerConfigTemplates(this);

                                template = input.args[0];
                                destination = input.args[1];

                                if (!(!template || !destination)) {
                                    _context3.next = 8;
                                    break;
                                }

                                throw "Usage: mason scaffold [template] [destination] [--var=val]";

                            case 8:
                                templates = this.runner.data.get("scaffold.templates");

                                if (!templates.has(template)) {
                                    _context3.next = 30;
                                    break;
                                }

                                flags = input.flags.indexOf("f") !== -1 || input.flags.indexOf("force") !== -1 ? "w+" : "wx";

                                withTemplate = function () {
                                    var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(fd, template) {
                                        var buffer;
                                        return regeneratorRuntime.wrap(function _callee2$(_context2) {
                                            while (1) {
                                                switch (_context2.prev = _context2.next) {
                                                    case 0:
                                                        _context2.next = 2;
                                                        return _this2.prepareTemplate(template);

                                                    case 2:
                                                        buffer = _context2.sent;
                                                        _context2.next = 5;
                                                        return _fs2.default.write(fd, buffer, function (err, written, buffer) {
                                                            if (err) {
                                                                throw err;
                                                            } else {
                                                                console.log("Template " + template + " written to " + destination);
                                                            }
                                                        });

                                                    case 5:
                                                    case "end":
                                                        return _context2.stop();
                                                }
                                            }
                                        }, _callee2, _this2);
                                    }));

                                    return function withTemplate(_x4, _x5) {
                                        return _ref3.apply(this, arguments);
                                    };
                                }();

                                templateObj = templates.get(template);
                                _conf = this.conf.scaffold || {};
                                destination_prefix = void 0;

                                if ((typeof templateObj === "undefined" ? "undefined" : _typeof(templateObj)) == "object") {
                                    if (typeof templateObj.destination !== "undefined") {
                                        destination_prefix = templateObj.destination;
                                    }
                                }

                                if (destination.substr(0, 1) == "/") {
                                    // Hold out
                                } else {
                                    if (destination_prefix) {
                                        destination = destination_prefix + _path2.default.sep + destination;
                                    } else if (_conf.destination_path) {
                                        destination = _conf.destination_path + _path2.default.sep + destination;
                                    }
                                }

                                // Attempt to open a write stream to the destination
                                fd = void 0;
                                _context3.prev = 18;

                                fd = _fs2.default.openSync(destination, flags);
                                _context3.next = 25;
                                break;

                            case 22:
                                _context3.prev = 22;
                                _context3.t0 = _context3["catch"](18);
                                throw "The file at " + destination + " already exists or is not readable.";

                            case 25:
                                _context3.next = 27;
                                return withTemplate(fd, template);

                            case 27:
                                return _context3.abrupt("return", _context3.sent);

                            case 30:
                                console.log("Invalid template requested: " + template);

                            case 31:
                                _context3.next = 34;
                                break;

                            case 33:
                                console.log("What do you want to scaffold?");

                            case 34:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[18, 22]]);
            }));

            function run(_x2, _x3) {
                return _ref2.apply(this, arguments);
            }

            return run;
        }()
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
        key: "run",
        value: function run(resolve, reject) {
            ScaffoldUtil.registerConfigTemplates(this);

            console.log("Mason Templates");
            console.log("---------------------------");
            var templates = this.runner.data.get("scaffold.templates");
            templates.forEach(function (location, name) {
                console.info(" + " + name + ": " + location);
            });
            console.log("---------------------------");
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
    Mason.registerCommand("scaffold", MasonScaffoldCommand);
    Mason.registerCommand("scaffold-ls", MasonScaffoldLSCommand);

    // Create a template store
    Mason.data.set("scaffold.templates", new Map());

    // Allow registration of scaffold templates from other plugins
    Mason.on("addScaffoldTemplate", function (opt) {
        if (opt.hasOwnProperty("name") && opt.hasOwnProperty("location")) {
            Mason.data.get("scaffold.templates").set(opt.name, opt.location);
        } else {
            console.error("Unable to register scaffold template. Invalid name or location.", opt);
        }
    });
};