'use strict';

var babel = require('babel-core');
var fs = require('fs');
var merge = require('merge');
var path = require('path');

var cache = {};
var filesToCompile = [];
var hasFile = {};

function addDependencies(result, resolveModuleToPath) {
	var imports = result.babel.metadata.modules.imports;
	imports.forEach(function(importData) {
		addDependency(importData.source, result.path, resolveModuleToPath);
	});
}

function addDependency(source, filename, resolveModuleToPath) {
	resolveModuleToPath = resolveModuleToPath || getFullPath;
	var fullPath = resolveModuleToPath(source, filename);
	if (!hasFile[fullPath]) {
		filesToCompile.push({
			options: {filename: fullPath}
		});
		hasFile[fullPath] = true;
	}
}

function assertFilenameOption(file) {
	if (!file.options || !file.options.filename) {
		throw new Error('Files passed to babel-deps need to specify their paths as the filename babel option');
	}
}

function clearCache() {
	cache = {};
}

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
		var transformed = transform(file, options);
		if (transformed) {
			results.push({
				babel: transform(file, options),
				path: file.options.filename
			});
			addDependencies(results[results.length - 1], options.resolveModuleToPath);
		}
	}
	return results;
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

function transform(file, options) {
	var filePath = file.options.filename;

	var cached = cache[filePath];
	if (options.cache && cached && (!file.contents || cached.contents === file.contents)) {
		return cached.babel;
	}

	if (!file.contents) {
		if (fs.existsSync(filePath)) {
			file.contents = fs.readFileSync(filePath, 'utf8');
		} else {
			console.warn('Could not find ' + filePath);
			return null;
		}
	}

	var currOptions = merge({}, options.babel, file.options);
	var result = babel.transform(file.contents, currOptions);
	if (options.cache) {
		cache[filePath] = {
			babel: result,
			contents: file.contents
		};
	}
	return result;
}

module.exports = compileFiles;
module.exports.getFullPath = getFullPath;
module.exports.clearCache = clearCache;
