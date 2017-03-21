'use strict';

/**
* @author: Popov Gennadiy <me@westtrade.t>
* @Date:   2016-12-15T17:23:48+03:00
* @Email:  me@westtrade.tk
* @Last modified by:   dio
* @Last modified time: 2017-03-21T05:46:15+03:00
*/

const http = require('http');
const https = require('https');
const zlib = require('zlib');

const pkg = require('../package.json');

const assert = require('assert');
const url = require('url');
const querystring = require('querystring');

const CleantalkResponse = require('./CleantalkResponse');
const CleantalkError = require('./CleantalkError');
const CleantalkRequest = require('./CleantalkRequest');

const iconv = require('iconv-lite');
const {flatten} = require('./util');

const ALLOWED_METHOD_NAMES = ['check_message', 'check_newuser', 'check', 'send_feedback', 'backlinks_check'];
const ALLOWED_LANGS = ['en', 'ru'];

const MODERATOR_API_URL = 'https://moderate.cleantalk.org/api2.0';
const SERVICE_API_URL = 'https://api.cleantalk.org/';

const privateProperties = Symbol('Private properties');
const requestMethod = Symbol('Request method');


/**
 * Cleantalk - remote API wrapper class
 *
 * @version 1.0.1
 * @author Popov Gennadiy (me@westtrade.tk)
 * @copyright (C) 2016 Popov Gennadiy (me@westtrade.tk)
 * @license MIT: {@link https://mit-license.org/}
 * @see {@link https://github.com/westtrade/cleantalk}
 */
class Cleantalk {

	/**
	 * auth_key - Getter for service authorization key property
	 *
	 * @return {String}
	 */
	get auth_key() {
		return this[privateProperties].auth_key;
	}

	/**
	 * language - Getter for language property
	 *
	 * @return {String}
	 */
	get language() {
		return this[privateProperties].language || 'en';
	}

	/**
	 * language - Setter for language property
	 * @param  {String} language Language of suggestion returned in response
	 */
	set language(language) {
		language = language || 'en';
		// assert(ALLOWED_LANGS.includes(language), `Language must be included in allowed languages: ${ALLOWED_LANGS.join(', ')}.`);
		this[privateProperties].language = language;
	}

	/**
	 * server_url - Getter for server api url property
	 *
	 * @return {String}
	 */
	get server_url() {
		return this[privateProperties].server_url || MODERATOR_API_URL;
	}

	/**
	 * agent - Getter for server client agent property
	 *
	 * @return {String}
	 */
	get agent() {
		return this[privateProperties].agent;
	}

	/**
	 * constructor - Constructor method for Cleantalk API class
	 *
	 * @param {object} Options            Service required initial options
	 *
	 * @param {String} Options.auth_key   Service authorization key, you will
	 * find it in you control panel
	 * (Access key){@link https://cleantalk.org/register?platform=api;}
	 *
	 * @param {String} Options.server_url Link to API endpoint, default is
	 * https://moderate.cleantalk.org/api2.0
	 *
	 * @param {String} Options.language   Language may be 'ru' or 'en'
	 *
	 */
	 constructor({auth_key, server_url, language} = {}) {

		assert(auth_key, 'Authentication key ($auth_key) must be defined.');
		assert.equal(typeof auth_key, 'string', 'Auth key must be a string.');

		language = language || 'en';
		// assert(ALLOWED_LANGS.includes(language), `Language must be included in allowed languages: ${ALLOWED_LANGS.join(', ')}.`);

		server_url = server_url || MODERATOR_API_URL;

		const agent = `nodejs-api-${pkg.version}`;

		this[privateProperties] = {
			auth_key,
			server_url,
			language,
			agent,
		};
	}

	/**
	 * isAllowMessage - High level function - check whether it is possible to post new message
	 *
	 * @param {CleantalkRequest} request Description
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {CleantalkResponse} Description
	 */
	isAllowMessage(request) {
		assert(request instanceof CleantalkRequest, 'Argument request must be instance of CleantalkRequest');
		return request.ready.then(data => this.checkMessage(data));
	}

	/**
	 * isAllowUser - High level function - check whether it is possible to register new user
	 *
	 * @param {CleantalkRequest} request Description
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {CleantalkResponse} Description
	 */
	isAllowUser(request) {
		assert(request instanceof CleantalkRequest, 'Argument request must be instance of CleantalkRequest');
		return request.ready.then(data => this.checkMessage(data));
	}

	/**
	 * checkNewUser - Low level function - checks whether it is possible to register new user
	 *
	 * @see {@link https://cleantalk.org/help/api-check-newuser}
	 *
	 * @param {object} 		Options                 Method options
	 * @param {String}   	Options.sender_email    Email for spam checking, Required.
	 * @param {String}   	Options.sender_ip       IP for spam checking. Required.
	 *
	 * @param {Boolean}  	Options.js_on           Is JavaScript enabled in
	 * user's browser. Default null. Js_on can be calculated by evaluating some
	 * JavaScript code in browser and comparing with reference value
	 * on server side. Very important parameter.
	 *
	 * valid are 0|1|2
	 * Status:
	 *  null - JS html code not inserted into phpBB templates
	 *  0 - JS disabled at the client browser
	 *  1 - JS enabled at the client broswer
	 *
	 * @param {Integer}		Options.submit_time     Form submitting time in seconds. Required.
	 *  Submit_time is the difference between submitting form time and
	 *  page accessing time. Very important parameter.
	 *
	 * @param {Object}   	Options.all_headers     HTTP-request headers
	 * @param {String} 		Options.sender_nickname Sender nickname for spam checking. Optional
	 * @param {Object} 		Options.sender_info     Any additional information about sender
	 * @param {type}   		Options.tz              Sender's timezone
	 * @param {String} 		Options.phone           Sender's phone nubmer
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {CleantalkResponse} Promised object with result of request
	 */
	checkNewUser({sender_email, sender_ip, js_on, submit_time, all_headers, sender_nickname, sender_info, tz, phone} = {}) {

		assert(sender_email, 'Sender email argument (sender_email) is required.');
		assert.equal(typeof sender_email, 'string', 'Sender email argument must be a string.');

		assert(sender_ip, 'Sender IP argument (sender_ip) is required.');
		assert.equal(typeof sender_ip, 'string', 'Sender IP argument must be a string.');

		assert(submit_time, 'Submit time argument (submit_time) is required.');
		submit_time = parseInt(submit_time);
		assert.equal(isNaN(submit_time), false, 'Submit type (submit_time) argument must be a integer.');

		const data = {sender_email, sender_ip, submit_time};

		if (js_on) {
			js_on = +!!js_on;
			data.js_on = js_on;
		}

		if (all_headers) {
			data.all_headers = JSON.stringify(all_headers);
		}

		if (sender_nickname) {
			assert.equal(typeof sender_nickname, 'string', 'Sender nickname argument must be a string.');
			data.sender_nickname = sender_nickname;
		}

		if (sender_info) {
			assert.equal(typeof sender_info, 'object', 'Sender info (sender_info) argument must be an object.');
			data.sender_info = sender_info;
		}

		if (tz) {
			assert.equal(typeof tz, 'string', 'TZ argument must be a string.');
			data.tz = tz;
		}

		if (phone) {
			assert.equal(typeof phone, 'string', 'Phone argument must be a string.');
			data.phone = phone;
		}

		return this.sendRequest('check_newuser', data);
	}

	/**
	 * checkMessage - Function checks whether it is possible to publish the message
	 *
	 * @see {@link https://cleantalk.org/help/api-check-message}
	 *
	 * @param {object} 		Options                 Method options
	 * @param {String}   	Options.sender_email    Email for spam checking, Required.
	 * @param {String}   	Options.sender_ip       IP for spam checking. Required.
	 *
	 * @param {Boolean}  	Options.js_on           Is JavaScript enabled in
	 * user's browser. Default null. Js_on can be calculated by evaluating some
	 * JavaScript code in browser and comparing with reference value
	 * on server side. Very important parameter.
	 *
	 * valid are 0|1|2
	 * Status:
	 *  null - JS html code not inserted into phpBB templates
	 *  0 - JS disabled at the client browser
	 *  1 - JS enabled at the client broswer
	 *
	 * @param {Integer}		Options.submit_time     Form submitting time in seconds. Required.
	 *  Submit_time is the difference between submitting form time and
	 *  page accessing time. Very important parameter.
	 *
	 * @param {Object}   	Options.all_headers     HTTP-request headers
	 * @param {String} 		Options.sender_nickname Sender nickname for spam checking. Optional
	 * @param {String}   	Options.message         Text message for checking, can contain HTML-tags
	 * @param {Object}   	Options.sender_info     Any additional information about sender
	 * @param {Object} 		Options.post_info       Additional information about message
	 * @param {Boolean}   	Options.stoplist_check  logical flag to check
	 * message via stop-words list (1 or 0) (should be enabled in account);
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {CleantalkResponse} Promised object with result of request
	 */
	checkMessage({sender_email, sender_ip, js_on, submit_time, all_headers, sender_nickname, message, sender_info, post_info, stoplist_check} = {}) {

		assert(sender_email, 'Sender email argument (sender_email) is required.');
		assert.equal(typeof sender_email, 'string', 'Sender email argument must be a string.');

		assert(sender_ip, 'Sender IP argument (sender_ip) is required.');
		assert.equal(typeof sender_ip, 'string', 'Sender IP argument must be a string.');

		assert(submit_time, 'Submit time argument (submit_time) is required.');
		submit_time = parseInt(submit_time);
		assert.equal(isNaN(submit_time), false, 'Submit type (submit_time) argument must be a integer.');

		const data = {sender_email, sender_ip, submit_time};

		if (js_on) {
			js_on = +!!js_on;
			data.js_on = js_on;
		}

		if (all_headers) {
			data.all_headers = JSON.stringify(all_headers);
		}

		if (sender_nickname) {
			assert.equal(typeof sender_nickname, 'string', 'Sender nickname argument must be a string.');
			data.sender_nickname = sender_nickname;
		}

		if (message) {
			assert.equal(typeof message, 'string', 'Message argument must be a string.');
			data.message = message;
		}

		if (sender_info) {
			data.sender_info = JSON.stringify(sender_info);
		}

		if (post_info) {
			assert.equal(typeof post_info, 'object', 'Post info (post_info) argument must be an object.');
			assert(!('comment_type' in post_info), 'Post info (post_info) argument need to contain `comment_type` key.');
			data.post_info = JSON.stringify(post_info);
		}

		if (typeof stoplist_check !== 'undefined') {
			stoplist_check = +!!stoplist_check;
			data.stoplist_check = stoplist_check;
		}

		return this.sendRequest('check_message', data);
	}

	/**
	 * ipInfo - The API method ip_info() returns a 2 letter country code
	 * (US, UK, CN and etc) for an IP address. You can specify a list
	 * for IP address to find countries for each IP address by one API call.
	 *
	 * @param {array} ipList  list of IP addresses
	 *
	 * @see https://cleantalk.org/help/api-ip-info-country-code'
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {Object} Promised result object, e.g. {"data":{"8.8.8.8":{"country_code":"US","country_name":"United States"}}}
	 */
	ipInfo(...ipList) {

		ipList = flatten(ipList);

		const method_name = 'ip_info';
		const query = {method_name};

		let data = null;
		if (ipList.length === 1) {
			query.ip = ipList[0];
		} else {
			data = `data=${ipList.join()}`;
		}

		const currentQuery = querystring.stringify(query);
		const requestUrl = `${SERVICE_API_URL}?${currentQuery}`;

		return this[requestMethod](requestUrl, data);
	}

	/**
	 * sendFeedback - This method should be used only for moderator feedbacks.
	 * 	It doesn't check spam. It sends back result of manual moderation.
	 *
	 * @see {@link https://cleantalk.org/help/api-send-feedback}
	 *
	 * @param {array} requestList List of receipt request ids with status code,
	 * e.g. <request_id1>:<0|1>
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {Object} Promisified object e.g. {"received " : 2, "comment" : "OK"},
	 * where received - number of received request IDs and comment
	 * - server answer, normally 'Ok'
	 */
	sendFeedback(...requestList) {
		const feedback = requestList.map(([id, fb]) => `${id.trim()}:${+!!fb}`).join(';');
		const data = {feedback};
		return this.sendRequest('send_feedback', data);
	}

	/**
	 * spamCheck - This method should be used only for mass check IPs, emails
	 * for spam activity
	 *
	 * @see {@link https://cleantalk.org/help/api-without}
	 *
	 * @param {array} addressList List of IP or email lists
	 * , e.g. (stop_email@example.com, 127.0.0.1)
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {Object} Promised response data
	 * , e.g. {"data":{"127.0.0.1":{"appears":0},"stop_email@example.com":
	 * {"appears":1,"frequency":"999","updated":"2019-04-24 23:33:00"}}}
	 * explanation
	 * data - array with checked records,
	 * record - array with details per record,
	 * appears - marker witch define record status in the blacklists 0|1.
	 * spam_rate - a rating of spam activity from 0 to 100%. 100 means certain spam.
	 * frequency - is a number of web-sites that reported about spam activity
	 * of the record. It can be from 0 up to 9999.
	 */
	spamCheck(...addressList) {

		addressList = flatten(addressList);

		const method_name = 'spam_check';
		const query = {method_name, auth_key: this.auth_key};

		const currentQuery = querystring.stringify(query);
		const data = `data=${addressList.join()}`;
		const requestUrl = `${SERVICE_API_URL}?${currentQuery}`;
		return this[requestMethod](requestUrl, data);
	}

	/**
	 * backlinksCheck - This method should be used only for mass backlinks
	 * check for a domain list
	 *
	 * @param {array} domains List of domains for checking
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {type} Promised response data, e.g.
	 * {"data":{"example.com":{"appears":1,"frequency":"164",
	 * "updated":"2016-08-05 07:15:51"}}}
	 *
	 * explanation
	 * data - array with results
	 * appears - marker which defines record existence in the database 0|1.
	 * frequency - counts websites with backlinks in the record.
	 * updated - last time a backlink was found.
	 */
	backlinksCheck(...domains) {

		domains = flatten(domains);

		const method_name = 'backlinks_check';
		const query = {method_name, auth_key: this.auth_key};
		const currentQuery = querystring.stringify(query);
		const data = `data=${domains.join()}`;
		const requestUrl = `${SERVICE_API_URL}?${currentQuery}`;

		return this[requestMethod](requestUrl, data);
	}

	/**
	 * sendRequest - Publi method for promisified request to moderator Cleantalk API
	 *
	 * @param {String} method 		Name of remote method
	 * @param {Object} data      	Request post data
	 *
	 * @throws {CleantalkError}
	 * @throws {SyntaxError}
	 *
	 * @return {CleantalkResponse} Promised result of request
	 */
	sendRequest(method, params = {}) {

		assert(ALLOWED_METHOD_NAMES.includes(method), `Method name ($method) must be included in the list of allowed names: ${ALLOWED_METHOD_NAMES.join(', ')}.`);

		const localParams = Object.assign({}, params);
		localParams.method_name = method;

		localParams.response_lang = this.language;
		localParams.auth_key = this.auth_key;
		localParams.agent = this.agent;

		const data = JSON.stringify(localParams);
		return this[requestMethod](this.server_url, data)
			.then(resultData => new CleantalkResponse(resultData));
	}

	/**
	 * requestMethod - Private method for creating promisified requests to API server
	 *
	 * @param {String} requestUrl URL endpoint
	 * @param {Object} data       Request post data
	 *
	 * @throws {SyntaxError}
	 *
	 * @return {Promise} Promised result of request
	 */
	[requestMethod] (requestUrl, data) {

		return new Promise((resolve, reject) => {

			const info = url.parse(requestUrl);

			let {protocol, hostname, port, path} = info;
			port = port || (protocol === 'https:' ? 443 : 80);

			const method = data ? 'POST' : 'GET';
			const requestLib = protocol === 'https:' ? https : http;

			const requestData = {protocol, hostname, port, method, path};

			requestData.headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(data || ''),
				'Accept-Encoding': 'gzip,deflate',
			};

			const request = requestLib.request(requestData, (res) => {

				let responseData = '';
				res.on('data', chunk => {
					responseData += chunk.toString('UTF-8').trim();
				});

				res.on('end', () => {

					// const converter = new Iconv('UTF-8', 'ISO-8859-1');

					try {

						const data = JSON.parse(responseData);
						const result = Object.keys(data)
							.reduce((result, currentKey) => {
								result[currentKey] = typeof data[currentKey] === 'string'
									? iconv.encode(data[currentKey], 'ISO-8859-1').toString('UTF-8')
									: data[currentKey];
								return result;
							}, {});


						const {error_message, error_no} = result;
						if (error_message) {
							const error = new CleantalkError(error_message, error_no);
							reject(error);
						} else {
							resolve(result);
						}

					} catch (error) {
						reject(error);
					}
				});
			});

			request.write(data || '');
			request.pipe(zlib.createGunzip());
			request.end();
		});
	}
}

module.exports = Cleantalk;
