'use strict';

/**
* @file Example http server with antispam protection
* @author: Popov Gennadiy <me@westtrade.tk>
* @date:   2016-12-16T23:12:29+03:00
* @email:  me@westtrade.tk
*
*
* @Last modified by:   dio
* @Last modified time: 2017-03-30T13:10:43+03:00
*/

const environment = process.env.NODE_ENV || 'development';
let auth_key = process.env.CLEANTALK_AUTH_KEY || null;
const language = process.env.CLEANTALK_LANGUAGE || 'en';

const http = require('http');
const url = require('url');
const fs = require('fs');

const CleantalkRequest = require('../../src/CleantalkRequest');
const Cleantalk = require('../../');

const { formTemplate, log, addressMessage, logoEndpoint, parseForm } = require('../common');

const aliases = {
	sender_email: 'body.sender_email',
	sender_nickname: 'body.sender_nickname',
	message: 'body.message',
};

const session = { errors: [], data: {} };

const server = http.createServer((request, res) => {
	const {pathname, query} = url.parse(request.url);
	log('PATH', pathname);
	switch (true) {

	case pathname === '/' && request.method === 'GET':
		res.writeHead(200, {'Content-Type': 'text/html'});
		const formHTML = formTemplate(session, auth_key);
		res.end(formHTML);

		session.errors = [];
		session.data = {};
		break;

	case pathname === '/reset':
		auth_key = null;
		res.writeHead(303, {'Location': '/'});
		res.end();
		break;

	case pathname === '/cleantalk-logo-main.png':
		logoEndpoint(request, res);
		break;

	case pathname === '/post_message':
		if (!auth_key) {
			return parseForm(request).then((data) => {
				const {auth_key: currentAuthKey = null } = data;
				auth_key = currentAuthKey;
				res.writeHead(303, {'Location': '/'});
				res.end();
			});
		}

		try {
			const ctClient = new Cleantalk({ auth_key, language });
			ctClient
				.isAllowMessage(new CleantalkRequest({ request, aliases, language }))
				.then(decision => {

					if (!decision.isAllowed) {
						session.errors.push({message: decision.comment});
						// res.writeHead(403, {'Content-Type': 'text/html'});
						// return res.end(`
						// 	<h1>Forbidden!</h1>
						// 	${environment === 'development' ? `<pre>${decision.comment}</pre>` : ''}
						// `);
					}

					res.writeHead(303, {'Location': '/'});
					res.end();

				}).catch(error => {
					session.errors.push({message: error.message});

					res.writeHead(500, {'Content-Type': 'text/html'});
					res.end(`
						<h1>Server error!</h1>
						${environment === 'development' ? `<pre>${error.stack}</pre>` : ''}
					`);
				});

		} catch (error) {
			session.errors.push({ message: error.message });
			res.writeHead(301, {'Location': '/'});
			res.end();
		}

		break;

	default:
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.end('<h1>Not found</h1>');
	}

}).listen(9081, () => addressMessage(server));

process.on('SIGINT', function() {
	process.exit();
});
