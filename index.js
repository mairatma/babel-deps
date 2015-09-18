'use strict';

var babel = require('babel-core');
var fs = require('fs');
var merge = require('merge');
var path = require('path');

var filesToCompile = [];
var hasFile = {};

function compileFiles(files, opt_options) {
	hasFile = {};
	for (var i = 0; i < files.length; i++) {
		if (!files[i].options || !files[i].options.filename) {
			throw new Error('Files passed to babel-deps need to specify their paths as the filename babel option');
		}
		hasFile[files[i].options.filename] = true;
	}

	var options = opt_options || {};
	var results = [];
	filesToCompile = files.concat();
	for (var i = 0; i < filesToCompile.length; i++) {
		var file = filesToCompile[i];
		var currOptions = merge({}, options);
		currOptions.babel = merge({}, currOptions.babel, file.options);
		currOptions = normalizeOptions(currOptions);
		results.push({
			babel: babel.transform(file.contents, currOptions.babel),
			path: file.options.filename
		});
	}
	return results;
}

function fetchDependency(source, filename, resolveModuleToPath) {
	resolveModuleToPath = resolveModuleToPath || getFullPath;
	var fullPath = resolveModuleToPath(source, filename);
	if (!hasFile[fullPath]) {
		if (fs.existsSync(fullPath)) {
			filesToCompile.push({
				contents: fs.readFileSync(fullPath, 'utf8'),
				options: {filename: fullPath}
			});
		} else {
			console.warn('Could not find ' + fullPath);
		}
		hasFile[fullPath] = true;
	}
}

function getFullPath(source, filename) {
	var fullPath = source;
	if (fullPath.substr(fullPath.length - 3) !== '.js') {
		fullPath += '.js';
	}
	if (fullPath[0] === '.') {
		fullPath = path.resolve(path.dirname(filename), fullPath);
	}
	return fullPath;
}

function normalizeOptions(options) {
	if (options.babel.resolveModuleSource) {
		var originalFn = options.babel.resolveModuleSource;
		options.babel.resolveModuleSource = function(source, filename) {
			var newSource = originalFn(source, filename);
			if (!options.fetchFromOriginalModuleSource) {
				source = newSource;
			}
			fetchDependency(source, filename, options.resolveModuleToPath);
			return newSource;
		};
	} else {
		options.babel.resolveModuleSource = function(source, filename) {
			fetchDependency(source, filename, options.resolveModuleToPath);
			return source;
		};
	}
	return options;
}

module.exports = compileFiles;
module.exports.getFullPath = getFullPath;
