'use strict';

/**
* @file Example http server with antispam protection
* @author: Popov Gennadiy <me@westtrade.tk>
* @date:   2016-12-16T23:12:29+03:00
* @email:  me@westtrade.tk
*
*
* @Last modified by:   dio
* @Last modified time: 2017-03-21T08:45:37+03:00
*/

const environment = process.env.NODE_ENV || 'development';
let auth_key = process.env.CLEANTALK_AUTH_KEY || null;
const language = process.env.CLEANTALK_LANGUAGE || 'en';

const http = require('http');
const url = require('url');
const qs = require('querystring');
const fs = require('fs');

const CleantalkRequest = require('../src/CleantalkRequest');
const Cleantalk = require('../');


const log = (...args) => console.log(...args);
const formTemplate = ({errors, data}) => {
	const disabledBecauseNoKey = auth_key ? '' : 'disabled';

	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Cleantalk demo - just try it!</title>
<link href="https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/cerulean/bootstrap.min.css" rel="stylesheet">
</head><body><nav class="navbar navbar-default navbar-fixed-top"><div class="container-fluid">
	<div class="navbar-header"><strong class="navbar-brand"><img height="20px" align="left" src="/cleantalk-logo-main.png" />&nbsp;<span>CLEAN</span><span>TALK</span> DEMO</strong></div>
	<ul class="nav navbar-nav"><li><a target="_blank" href="https://cleantalk.org/">Cleantalk Official</a></li></ul>
</div></nav><br><br>
	<div class="jumbotron"><div class="container-fluid"><div class="col-xs-6">
		<h2 class="pull-right"><strong style="color: red;">Try it &rarr;</strong></h2>
		<h2 style="font-size: 45px;">
			<img src="/cleantalk-logo-main.png" style="margin-right: 5px; position: relative; top: -2px; height: 33px;" />
			<strong style="color: #49c73b;">CLEAN</strong><strong style="color: #349ebf;">TALK</strong>
		</h2>
		<hr style="border-top: solid 1px rgba(0, 0, 0, 0.2);" />
		<p>Cleantalk is spam protection service for forums, boards, blogs and sites.</p>
		<p>No Captcha, no questions, no counting animals, no puzzles, no math. Fight spam!</p>
	</div>

	<div class="col-xs-6">
		<form class="panel panel-default" action="/post_message" method="POST">
		<div class="panel-heading">
			<strong>CHECK MESSAGE</strong>
			<div class="pull-right"><strong>API KEY: </strong>${ auth_key ? `<a href="/reset">${ auth_key }</a>` : 'No set' }</div>
		</div>
		<div class="panel-body">
			${errors && errors.length ? '<ul class="alert alert-danger" role="alert">' : ''}
			${(errors || []).map(error => `<div>- ${error.message}</div>`).join('')}
			${errors && errors.length ? '</ul>' : ''}

			${auth_key ? '' : `
				<div class="alert alert-info">
					Before you can start you need to set up your auth key.
				</div>
				<div class="form-group">
					<label for="auth_key">Auth key</label>
					<input type="input" class="form-control" name="auth_key" value="${ data.auth_key || '' }"><br>
					<div class="help-block">If you don't have auth key (Access key), you can get it <a target="_blank" href="https://cleantalk.org/my">there</a></div>
				</div>
			`}

			${!auth_key ? '' : `
				<label for="sender_email">EMail</label>
				<input type="email" class="form-control" ${disabledBecauseNoKey} name="sender_email" value="${data.sender_email || 'stop_email@example.com'}"><br>

				<label for="sender_nickname">Nickname</label>
				<input type="text"  class="form-control" ${disabledBecauseNoKey} name="sender_nickname" value="${data.sender_nickname || 'John Doe'}"><br>

				<label for="message">Message</label>
				<textarea name="message" ${disabledBecauseNoKey} class="form-control" rows="8" cols="80">${data.message || 'Spam message'}</textarea><br>
			`}
			</div>
			<div class="panel-footer clearfix">
				<input class="btn btn-success pull-right" value="${ !auth_key ? 'Get key' : 'Check message' }" type="submit">
			</div>
		</form>
	</div>
</div></div></body></html>`;
};

const parseForm = req => new Promise(resolve => {
	let res = '';
	req.on('data', chunk => res += chunk.toString('utf-8'))
	.on('end', () => resolve(qs.parse(res)));
});

const session = {errors: [], data: {}};

const server = http.createServer((request, res) => {

	const {pathname, query} = url.parse(request.url);
	console.log('PATH', pathname);
	switch (true) {

	case pathname === '/' && request.method === 'GET':
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(formTemplate(session));

		session.errors = [];
		session.data = {};
		break;

	case pathname === '/reset':
		auth_key = null;
		res.writeHead(303, {'Location': '/'});
		res.end();
		break;

	case pathname === '/cleantalk-logo-main.png':
		fs.createReadStream('./examples/cleantalk-logo-main.png').pipe(res);
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

		const aliases = {
			sender_email: 'body.sender_email',
			sender_nickname: 'body.sender_nickname',
			message: 'body.message',
		};

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

}).listen(9081, 'localhost', () => log(`Started at: http://${server.address().address}:${server.address().port}/`));
