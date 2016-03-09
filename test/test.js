'use strict';

var assert = require('assert');
var babelDeps = require('../index');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');

module.exports = {
	tearDown: function(done) {
		babelDeps.clearCache();
		done();
	},

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
			contents: 'import foo from "/missing/path/foo";\nimport bar from "./bar";',
			options: {filename: path.resolve('test/assets/temp.js')}
		}];
		sinon.stub(console, 'warn');

		var results;
		assert.doesNotThrow(function() {
			results = babelDeps(files);
		});

		assert.strictEqual(2, results.length);
		assert.strictEqual(path.resolve('test/assets/temp.js'), results[0].path);
		assert.strictEqual(path.resolve('test/assets/bar.js'), results[1].path);
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

	testCacheResultsWithOption: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/main.js')}
			}
		];
		var results = babelDeps(files, {cache: true});
		var results2 = babelDeps(files, {cache: true});

		assert.strictEqual(3, results.length);
		assert.strictEqual(results.length, results2.length);
		assert.strictEqual(results[0].babel, results2[0].babel);
		assert.strictEqual(results[1].babel, results2[1].babel);
		assert.strictEqual(results[2].babel, results2[2].babel);

		test.done();
	},

	testDontCacheResultsWithoutOption: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/main.js')}
			}
		];
		var results = babelDeps(files);
		var results2 = babelDeps(files);

		assert.strictEqual(3, results.length);
		assert.strictEqual(results.length, results2.length);
		assert.notStrictEqual(results[0].babel, results2[0].babel);
		assert.notStrictEqual(results[1].babel, results2[1].babel);
		assert.notStrictEqual(results[2].babel, results2[2].babel);

		test.done();
	},

	testDontUseCacheIfContentsChanged: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/main.js')}
			}
		];
		var results = babelDeps(files, {cache: true});

		files[0].contents = 'import bar from "./bar";';
		var results2 = babelDeps(files, {cache: true});

		assert.strictEqual(3, results.length);
		assert.strictEqual(2, results2.length);
		assert.strictEqual(results[0].path, results2[0].path);
		assert.notStrictEqual(results[0].babel, results2[0].babel);
		assert.strictEqual(results[2].babel, results2[1].babel);

		test.done();
	},

	testUseCacheResultsIfSameNamespace: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/main.js')}
			}
		];
		var results = babelDeps(files, {cache: 'test'});
		var results2 = babelDeps(files, {cache: 'test'});

		assert.strictEqual(3, results.length);
		assert.strictEqual(results.length, results2.length);
		assert.strictEqual(results[0].babel, results2[0].babel);
		assert.strictEqual(results[1].babel, results2[1].babel);
		assert.strictEqual(results[2].babel, results2[2].babel);

		test.done();
	},

	testDontUseCacheResultsIfDifferentNamespace: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/main.js')}
			}
		];
		var results = babelDeps(files, {cache: 'test'});
		var results2 = babelDeps(files, {cache: 'test2'});

		assert.strictEqual(3, results.length);
		assert.strictEqual(results.length, results2.length);
		assert.notStrictEqual(results[0].babel, results2[0].babel);
		assert.notStrictEqual(results[1].babel, results2[1].babel);
		assert.notStrictEqual(results[2].babel, results2[2].babel);

		test.done();
	},

	testSkipCachedFileResults: function(test) {
		var files = [
			{
				contents: fs.readFileSync(path.resolve('test/assets/main.js'), 'utf8'),
				options: {filename: path.resolve('test/assets/main.js')}
			}
		];
		var results = babelDeps(files, {cache: true, skipCachedFiles: true});

		files[0].contents = 'import bar from "./bar";';
		var results2 = babelDeps(files, {cache: true, skipCachedFiles: true});

		assert.strictEqual(3, results.length);
		assert.strictEqual(1, results2.length);
		assert.strictEqual(results[0].path, results2[0].path);
		assert.notStrictEqual(results[0].babel, results2[0].babel);

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
