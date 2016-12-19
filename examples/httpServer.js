'use strict';

/**
* @file Example http server with antispam protection
* @author: Popov Gennadiy <me@westtrade.tk>
* @date:   2016-12-16T23:12:29+03:00
* @email:  me@westtrade.tk
*
*
* @Last modified by:   dio
* @Last modified time: 2016-12-20T00:59:25+03:00
*/

const environment = process.env.NODE_ENV || 'development';
const auth_key = '';

const http = require('http');
const url = require('url');
const qs = require('querystring');

const CleantalkRequest = require('../src/CleantalkRequest');
const Cleantalk = require('../');

const ctClient = new Cleantalk({auth_key});

const log = (...args) => console.log(...args);
const form = ({errors, data}) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>body,input,button{font-size:13px;font-family:"Open sans","Helvetica";}input, textarea{border: solid 1px}label{font-weight:bold;display:block}</style>
</head><body><form action="/post_message?test=azazaza" method="POST"><br>
	${errors && errors.length ? `<ul style="color:red; padding: 10px; margin: 0 0 20px; list-style: none; border: solid 1px red;">` : ""}
	${(errors || []).map(error => `<li>- ${error.message}</li>`).join('')}
	${errors && errors.length ? "</ul>" : ""}
	<label for="sender_email">EMail</label>
	<input type="email" name="sender_email" value="${data.sender_email || 'stop_email@example.com'}"><br><br>

	<label for="sender_nickname">Nickname</label>
	<input type="text" name="sender_nickname" value="${data.sender_nickname || 'John Doe'}"><br><br>

	<label for="message">Message</label>
	<textarea name="message" rows="8" cols="80">${data.message || 'Spam message'}</textarea><br><br>
	<input type="submit">
</form></body></html>`;

const parseForm = req => new Promise(resolve => {
	let res = '';
	req.on('data', chunk => res += chunk.toString('utf-8'))
	.on('end', () => resolve(qs.parse(res)));
});

const session = {errors: [], data: {}};

const server = http.createServer((request, res) => {

	const {pathname, query} = url.parse(request.url);
	switch (true) {

	case pathname === '/' && request.method === 'GET':
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(form(session));
		session.errors = [];
		session.data = {};
		break;

	case pathname === '/post_message':

		const aliases = {
			sender_email: 'body.sender_email',
			sender_nickname: 'body.sender_nickname',
			message: 'body.message',
		};

		ctClient
			.isAllowMessage(new CleantalkRequest({request, aliases, }))
			.then(decision => {

				if (!decision.isAllowed) {
					session.errors.push({message: decision.comment});
					// res.writeHead(403, {'Content-Type': 'text/html'});
					// return res.end(`
					// 	<h1>Forbidden!</h1>
					// 	${environment === 'development' ? `<pre>${decision.comment}</pre>` : ''}
					// `);
				}

				res.writeHead(301, {'Location': '/'});
				res.end();

			}).catch(error => {
				res.writeHead(500, {'Content-Type': 'text/html'});
				res.end(`
					<h1>Server error!</h1>
					${environment === 'development' ? `<pre>${error.stack}</pre>` : ''}
				`);
			})

		break;

	default:
		res.writeHead(404, {'Content-Type': 'text/html'});
		res.end('<h1>Not found</h1>');
	}

}).listen(9081, 'localhost', () => log(`Started at: http://${server.address().address}:${server.address().port}/`));
