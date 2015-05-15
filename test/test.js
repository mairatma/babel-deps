var assert = require('assert');
var fs = require('fs');
var path = require('path');
var babelDeps = require('../index');

module.exports = {
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

		test.done();
	}
};
