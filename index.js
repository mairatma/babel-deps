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
		var currOptions = merge({}, options, file.options);
		results.push({
			babel: babel.transform(file.contents, normalizeOptions(currOptions)),
			path: file.options.filename
		});
	}
	return results;
}

function fetchDependency(source, filename) {
	var fullPath = getFullPath(source, filename);
	if (!hasFile[fullPath]) {
		filesToCompile.push({
			contents: fs.readFileSync(fullPath, 'utf8'),
			options: {filename: fullPath}
		});
		hasFile[fullPath] = true;
	}
	return source;
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
	if (options.resolveModuleSource) {
		var originalFn = options.resolveModuleSource;
		options.resolveModuleSource = function(source, filename) {
			return fetchDependency(originalFn(source, filename), filename);
		};
	} else {
		options.resolveModuleSource = fetchDependency;
	}
	return options;
}

module.exports = compileFiles;
module.exports.getFullPath = getFullPath;
