'use strict';

/**
* @author: Popov Gennadiy <me@westtrade.tk>
* @Date:   2016-12-15T01:44:37+03:00
* @Email:  me@westtrade.tk
* @Last modified by:   dio
* @Last modified time: 2016-12-20T02:08:10+03:00
*/

const Cleantalk = require('../Cleantalk');
const CleantalkRequest = require('../CleantalkRequest');

const ALLOWED_REQUEST_TYPES = ['user', 'message'];
const assert = require('assert');

/**
 * cleantalkMiddleware - Express like frameworks middleware check request for spam
 *
 * @param {String} Options.auth_key   Service authorization key, you will
 * find it in you control panel
 * (Access key){@link https://cleantalk.org/register?platform=api;}
 *
 *
 * @param {object}   Options.aliases List of aliases
 * Explanation:
 * List of aliases in dot notaion e.g.
 * {
 * 	'sender_email': 'body.sender_email' - for post data in request body
 * 	'sender_nickname': 'query.sender_email' - for get data in http query like http://.../?sender_email=
 * }
 *
 * @param {object}   Options.options Parser options
 * Explanation:
 * @param {Boolean} Options.options.sendHeaders - automatic parse and send headers of request
 * @param {Array} Options.options.excludeHeaders - List of excluded headers
 * @param {String} Options.options.bodyType - Body parser type - maybe json or querystring, Default: querystring
 * @param {String} Options.options.server_url - Options.server_url Link to API endpoint, default is
 * https://moderate.cleantalk.org/api2.0
 *
 * @param Options.options.language - Language may be 'ru' or 'en'
 *
 * @param {String} type  - Type of request - maybe user or message
 *
 * @return {function} middleware function
 */
const cleantalkMiddleware = (auth_key, type, aliases, options) =>  {

	options = options || {};
	const {server_url, language} = options;

	assert(type, `Argument 'type' is required`);
	assert(ALLOWED_REQUEST_TYPES.includes(type), `Argument 'type' is '${ type }' and must be in allowed list: ${ALLOWED_REQUEST_TYPES.join(', ')}`);

	return function cleantalk(request, res, next) {
		auth_key = auth_key || request.app.get('cleantalk auth key');
		request.cleantalkDecision = {};

		if (!auth_key) {
			console.error(new Error('Authentication key ($auth_key) must be defined.'))
			return next();
		}

		const client = new Cleantalk({ auth_key, server_url, language });
		
		const method = type === 'message'
			? 'isAllowMessage'
			: 'isAllowUser';

		const ctRequest = new CleantalkRequest({options, aliases, request});

		client[method](ctRequest)
			.then(decision => {
				request.cleantalkDecision = decision;
				next();
			})
			.catch(error => next(error));
	};
};

module.exports = cleantalkMiddleware;
