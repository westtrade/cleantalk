'use strict';

/**
* @Author: Popov Gennadiy <dio>
* @Date:   2016-12-16T18:22:12+03:00
* @Email:  me@westtrade.tk
* @Last modified by:   dio
* @Last modified time: 2016-12-17T22:15:54+03:00
*/

class CleantalkError extends Error {

	constructor(message, code = -1) {

		super(message);
		this.name = this.constructor.name;

		code = parseInt(code);
		if (isNaN(code)) {
			code = -1; //Wrong code number
		};

		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = (new Error(message)).stack;
		}

		this.message = message;
		this.code = code;
	}
}


module.exports = CleantalkError;
