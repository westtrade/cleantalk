'use strict';

/**
* @Author: Popov Gennadiy <dio>
* @Date:   2016-12-17T18:19:23+03:00
* @Email:  me@westtrade.tk
* @Last modified by:   dio
* @Last modified time: 2017-03-21T06:11:36+03:00
*/

const zlib = require('zlib');

const {IncomingMessage} = require('http');
const assert = require('assert');
const url = require('url');
const qs = require('querystring');

const {getFromPath} = require('./util');

const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

const QUERYSTRING_BODY_TYPE = 'querystring';
const JSON_BODY_TYPE = 'json';

const defaultOptions = {
	sendHeaders: true,
	excludeHeaders: [],
	bodyType: QUERYSTRING_BODY_TYPE,
};

const ALLOWED_BODY_TYPES = [QUERYSTRING_BODY_TYPE, JSON_BODY_TYPE];

const privateKey = Symbol('Private properties');
const parseBody = Symbol('Parse headers method');


/**
 * CleantalkRequest - helper class
 */
class CleantalkRequest {

 /**
  * constructor - Description
  *
  * @param {object} Options         Description
  * @param {object}   Options.data    Predefined data
  * @param {object}   Options.options Parser options
  * Explanation:
  * Options.options.sendHeaders - automatic parse and send headers of request
  * Options.options.excludeHeaders - List of excluded headers
  * Options.options.bodyType - Body parser type - maybe json or querystring
  * Options.options.language - Language is alias for
  *
  * @param {object}   Options.aliases List of aliases
  * Explanation:
  * List of aliases in dot notaion e.g.
  * {
  * 	'sender_email': 'body.sender_email' - for post data in request body
  * 	'sender_nickname': 'query.sender_email' - for get data in http query like http://.../?sender_email=
  * }
  *
  * @param {IncomingMessage}
  *
  */
	constructor({data, options, aliases, request, language = 'en'} = {}) {
		if (request) {
			assert(request instanceof IncomingMessage, 'Request argument must be instance of http.ClientRequest.');
		}

		data = data || {
			submit_time: 3,
		};

		if (options) {
			assert.equal(typeof options, 'object', 'Options must be an object.');
		}

		options = options || {};
		if (options) {
			assert.equal(typeof options, 'object', 'Options must be an object.');
			options = Object.assign({}, defaultOptions, options);
		}

		const {sendHeaders, excludeHeaders, bodyType,} = options;

		aliases = aliases || {};
		if (aliases) {
			assert.equal(typeof aliases, 'object', 'Aliases must be an object.');
		}

		assert(ALLOWED_BODY_TYPES.includes(bodyType), `options.bodyType must be in list of allowed types ${ALLOWED_BODY_TYPES.join(', ')}`);

		if (!this.all_headers && sendHeaders) {

			this.all_headers = Object.keys(request.headers).reduce((headers, originalHeader) => {

				const header = capitalizeFirstLetter(originalHeader);
				if (excludeHeaders.includes(originalHeader)) {
					return headers;
				}

				headers[header] = request.headers[originalHeader];
				return headers;
			}, {});
		}

		let {sender_info, post_info} = data;

		if (!sender_info) {
			sender_info = sender_info || {};
			sender_info['remote_addr'] = request.headers['x-forwarded-for'] ||
				request.connection.remoteAddress ||
				request.socket.remoteAddress ||
				request.connection.socket.remoteAddress;

			sender_info['remote_addr'] = sender_info['remote_addr'].replace(/^.*:/, '');
			data.sender_info = sender_info;
		}

		if (!post_info) {
			post_info = post_info || {};
			post_info['REFFERRER'] = request.headers.referer;
			post_info['USER_AGENT'] = request.headers['user-agent'] || '';
			if (request.headers['x-ucbrowser-ua']) {  //special case of UC Browser
				post_info['USER_AGENT'] = request.headers['x-ucbrowser-ua'];
			}

			data.post_info = post_info;
		}

		data['x_forwarded_for'] = request.headers['x_forwarded_for'] || '';
		data['x_real_ip'] = request.headers['X_REAL_IP'] || '';
		data['sender_ip'] = sender_info['remote_addr'];


		let {query: queryRaw} = url.parse(request.url);

		const ready = this[parseBody](request, bodyType)
			.then((body = {}) => {
				let query = qs.parse(queryRaw);
				const inputData = {body, query};
				data = Object.keys(aliases).reduce((data, key) => {

					if (({}).hasOwnProperty.call(data, key)) {
						return data;
					}

					let aliasPath = aliases[key];
					let value = getFromPath(inputData, aliasPath);

					if (value) {
						data[key] = value;
					}
					return data;

				}, data);

				Object.assign(this, data);

				return this;
			});

		this[privateKey] = {
			ready,
		};
	}

	get ready() {
		return this[privateKey].ready;
	}

	[parseBody](request, bodyType = QUERYSTRING_BODY_TYPE) {

		return new Promise((resolve, reject) => {

			if (request.method === 'GET') {
				return resolve({});
			}

			let stream = request;

			let encoding = (request.headers['content-encoding'] || '').toLowerCase();

			switch (encoding) {
			case 'deflate':
				stream = stream.pipe(zlib.createInflate());
				break;
			case 'gzip':
				stream = stream.pipe(zlib.createInflate());
				break;
			}

			let body = '';

			stream.on('data', (chunk) => { body += chunk.toString('utf-8'); });
			stream.on('end', () => {

				let data = {};

				switch (bodyType) {
				case QUERYSTRING_BODY_TYPE:
					data = qs.parse(body);
					break;
				case JSON_BODY_TYPE:
					data = JSON.parse(body);
					break;
				default:
					reject(new Error('Wrong body type'));
				}

				resolve(data);
			});
		});
	}
}


module.exports = CleantalkRequest;
