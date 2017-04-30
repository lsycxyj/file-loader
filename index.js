/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var path = require("path");
var loaderUtils = require("loader-utils");

module.exports = function(content) {
	this.cacheable && this.cacheable();
	if(!this.emitFile) throw new Error("emitFile is required from module system");

	var query = loaderUtils.getOptions(this) || {};
	var configKey = query.config || "fileLoader";
	var options = this.options[configKey] || {};
	var config = {
		publicPath: false,
		useRelativePath: false,
		name: "[hash].[ext]"
	};

	// options takes precedence over config
	Object.keys(options).forEach(function(attr) {
		config[attr] = options[attr];
	});

	// query takes precedence over config and options
	Object.keys(query).forEach(function(attr) {
		config[attr] = query[attr];
	});

	var context = config.context || this.options.context;
	var url = loaderUtils.interpolateName(this, config.name, {
		context: context,
		content: content,
		regExp: config.regExp
	});

	var outputPath = "";

	var filePath = this.resourcePath;
	var issuerContext = this._module && this._module.issuer && this._module.issuer.context || context;
	if (config.useRelativePath) {
		var relativeUrl = issuerContext && path.relative(issuerContext, filePath).split(path.sep).join("/");
		var relativePath = relativeUrl && path.dirname(relativeUrl) + "/";
		if (~relativePath.indexOf("../")) {
			outputPath = path.posix.join(outputPath, relativePath, url);
		} else {
			outputPath = relativePath + url;
		}
		url = relativePath + url;
	}
	if (config.outputPath) {
		// support functions as outputPath to generate them dynamically
		outputPath = (
			typeof config.outputPath === "function"
			? config.outputPath(url, issuerContext)
			: config.outputPath + url
		);
		url = outputPath;
	} else {
		outputPath = url;
	}

	var publicPath = "__webpack_public_path__ + " + JSON.stringify(url);
	if (config.publicPath !== false) {
		// support functions as publicPath to generate them dynamically
		publicPath = JSON.stringify(
			typeof config.publicPath === "function"
			? config.publicPath(url, issuerContext)
			: config.publicPath + url
		);
	}

	if (query.emitFile === undefined || query.emitFile) {
		this.emitFile(outputPath, content);
	}

	return "module.exports = " + publicPath + ";";
};

module.exports.raw = true;
