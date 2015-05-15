babel-deps
===================================

Compiles javascript files and all their dependencies with babel.

## Usage
This tool uses [babel](npmjs.com/package/babel-core) to compile a list of files. The main difference from just using babel directly is that this will automatically load and compile any files that weren't given in the input list but are imported as dependencies. The results contain all compiled files, including the extra dependencies.

```javascript
	var files = [
		{
			contents: fs.readFileSync(path1, 'utf8'),
			options: {filename: path1}
		},
		{
			contents: fs.readFileSync(path1, 'utf8'),
			options: {filename: path1}
		}
	];
	var results = babelDeps(files, babelOptions);
```

## API

### files

An array of files to be compiled with their dependencies. Each element of the array should be an object with the following keys:

- `contents` **{string}** The code to be compiled.
- `options` **{!Object}** Options to be passed to babel when compiling this file. Note that the filename option is required.

### options

An object with babel options that should be used for all files. File specific options will be merged with this before the file is compiled, so they have higher priority.
