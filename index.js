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
		assertFilenameOption(files[i]);
		hasFile[files[i].options.filename] = true;
	}

	var options = opt_options || {};
	var results = [];
	filesToCompile = files.concat();
	for (var j = 0; j < filesToCompile.length; j++) {
		var file = filesToCompile[j];
		var currOptions = merge({}, options);
		currOptions.babel = merge({}, currOptions.babel, file.options);
		results.push({
			babel: babel.transform(file.contents, currOptions.babel),
			path: file.options.filename
		});
		fetchDependencies(results[j], options.resolveModuleToPath);
	}
	return results;
}

function assertFilenameOption(file) {
	if (!file.options || !file.options.filename) {
		throw new Error('Files passed to babel-deps need to specify their paths as the filename babel option');
	}
}

function fetchDependencies(result, resolveModuleToPath) {
	var imports = result.babel.metadata.modules.imports;
	imports.forEach(function(importData) {
		fetchDependency(importData.source, result.path, resolveModuleToPath);
	});
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

module.exports = compileFiles;
module.exports.getFullPath = getFullPath;
