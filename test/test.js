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

	testCompileWithResolveModuleSource: function(test) {
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
		var results = babelDeps(files, {resolveModuleSource: function(source) {
			if (source[0] !== '.') {
				source = './' + source;
			}
			return source;
		}});
		assert.strictEqual(3, results.length);
		assert.strictEqual(path.resolve('test/assets/mainAlias.js'), results[0].path);
		assert.strictEqual(path.resolve('test/assets/foo.js'), results[1].path);
		assert.strictEqual(path.resolve('test/assets/bar.js'), results[2].path);

		test.done();
	},

	testAbsolutePathDep: function(test) {
		var files = [{
			contents: 'import foo from "/absolute/path/foo";',
			options: {filename: path.resolve('test/assets/absolute.js')}
		}];
		sinon.stub(fs, 'readFileSync');

		var results = babelDeps(files);
		assert.strictEqual(1, fs.readFileSync.callCount);
		assert.strictEqual('/absolute/path/foo.js', fs.readFileSync.args[0][0]);
		assert.strictEqual(2, results.length);
		assert.strictEqual(path.resolve('test/assets/absolute.js'), results[0].path);
		assert.strictEqual(path.resolve('/absolute/path/foo.js'), results[1].path);

		fs.readFileSync.restore();
		test.done();
	}
};
