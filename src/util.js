'use strict';

/**
* @Author: Popov Gennadiy <dio>
* @Date:   2016-12-16T02:13:21+03:00
* @Email:  me@westtrade.tk
* @Last modified by:   dio
* @Last modified time: 2017-03-30T13:35:38+03:00
*/

// const assert = require('assert');
const split = dotPath => dotPath
	.replace('\\.', '--||--').split('.').map(chunk => chunk.replace('--||--', '.'));


const getFromPath = (ctx = {}, dotPath, defaultValue) => {

	const chunks = split(dotPath);
	let result = ctx;

	for (var i = 0; i < chunks.length; i++) {
		let chunk = chunks[i];
		if (!({}).hasOwnProperty.call(result, chunk)) {
			result = defaultValue;
			break;
		}
		result = result[chunk];
	}

	return result;
};

function flatten(source) {
	let result = [];
	let count = source.length;

	while (count--) {
		Array.isArray(source[count])
			? result.push(...flatten(source[count]))
			: result.push(source[count]);
	}

	return result;
}

module.exports = {flatten, getFromPath};
