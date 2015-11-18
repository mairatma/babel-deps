'use strict';

var assert = require('assert');
var babelDeps = require('../index');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');

module.exports = {
	testNoOptionsError: function(test) {
		var files = [{
			contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8')
		}];

		test.throws(function() {
			babelDeps(files);
		});
		test.done();
	},

	testNoFilenameError: function(test) {
		var files = [{
			contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
			options: {}
		}];

		test.throws(function() {
			babelDeps(files);
		});
		test.done();
	},

	testCompileDependency: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/main.js')}
			},
			{
				contents: fs.readFileSync(path.resolve('test/assets/foo.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/foo.js')}
			}
		];
		var results = babelDeps(files);
		assert.strictEqual(3, results.length);
		assert.strictEqual(path.resolve('test/assets/main.js'), results[0].path);
		assert.strictEqual(path.resolve('test/assets/foo.js'), results[1].path);
		assert.strictEqual(path.resolve('test/assets/bar.js'), results[2].path);

		test.done();
	},

	testMissingDependency: function(test) {
		var files = [{
			contents: 'import foo from "/missing/path/foo";',
			options: {filename: path.resolve('test/assets/missing.js')}
		}];
		sinon.stub(console, 'warn');

		assert.doesNotThrow(function() {
			babelDeps(files);
		});

		assert.strictEqual(1, console.warn.callCount);
		console.warn.restore();
		test.done();
	},

	testResolveModuleToPathOption: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/mainAlias.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/mainAlias.js')}
			},
			{
				contents: fs.readFileSync(path.resolve('test/assets/foo.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/foo.js')}
			}
		];
		var results = babelDeps(files, {
			resolveModuleToPath: function(source, filename) {
				return path.resolve(path.dirname(filename), source + '.js');
			}
		});
		assert.strictEqual(3, results.length);
		assert.strictEqual(path.resolve('test/assets/mainAlias.js'), results[0].path);
		assert.strictEqual(path.resolve('test/assets/foo.js'), results[1].path);
		assert.strictEqual(path.resolve('test/assets/bar.js'), results[2].path);

		test.done();
	},

	testAbsolutePathDep: function(test) {
		var absolutePath = path.join(__dirname, 'assets/foo.js');
		var files = [{
			contents: 'import foo from "' + absolutePath + '";',
			options: {filename: path.resolve('test/assets/absolute.js')}
		}];

		var called;
		var originalFn = fs.readFileSync;
		sinon.stub(fs, 'readFileSync', function(filePath, enc) {
			if (filePath === absolutePath) {
				called = true;
			} else {
				return originalFn(filePath, enc);
			}
		});

		var results = babelDeps(files);
		assert.ok(called);
		assert.strictEqual(2, results.length);
		assert.strictEqual(path.resolve('test/assets/absolute.js'), results[0].path);
		assert.strictEqual(absolutePath, results[1].path);

		fs.readFileSync.restore();
		test.done();
	},

	testGetFullPath: function(test) {
		assert.strictEqual('/full/path/foo.js', babelDeps.getFullPath('./foo', '/full/path/bar.js'));
		assert.strictEqual('/full/path/foo.js', babelDeps.getFullPath('./foo.js', '/full/path/bar.js'));
		assert.strictEqual('/full/path2/foo.js', babelDeps.getFullPath('/full/path2/foo', '/full/path/bar.js'));
		assert.strictEqual('/full/path2/foo.js', babelDeps.getFullPath('/full/path2/foo.js', '/full/path/bar.js'));
		test.done();
	}
};
