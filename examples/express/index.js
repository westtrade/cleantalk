'use strict';

const { getIps, log, addressMessage, logoEndpoint, formTemplate, parseForm } = require('../common');

const Express = require('express');
const app = new Express();
const session = { errors: [], data: {} };

const CleantalkMiddleware = require('../../src/middlewares/express');

const environment = process.env.NODE_ENV || 'development';
let auth_key = process.env.CLEANTALK_AUTH_KEY || null;
const language = process.env.CLEANTALK_LANGUAGE || 'en';

const aliases = {
    sender_email: 'body.sender_email',
    sender_nickname: 'body.sender_nickname',
    message: 'body.message',
};

app.use((req, res, next) => {
    log('PATH', req.originalUrl);
    app.set('cleantalk auth key', auth_key);
    next();
})

app.get('/', (req, res) => {
    res.send(formTemplate(session, auth_key));
    session.errors = [];
    session.data = {};
})

app.get('/reset', (req, res) => {
    auth_key = null;
    res.redirect(303, '/');
});

app.get('/cleantalk-logo-main.png', logoEndpoint);
app.post('/post_message', CleantalkMiddleware(auth_key, 'message', aliases), (req, res) => {
    if (!auth_key) {
        return parseForm(req).then((data) => {
            const { auth_key: currentAuthKey = null } = data;
            auth_key = currentAuthKey;
            res.redirect(303, '/');
        });
    }

    if (!req.cleantalkDecision.isAllowed) {
        session.errors.push({ message: req.cleantalkDecision.comment });
        // res.writeHead(403, {'Content-Type': 'text/html'});
        // return res.end(`
        // 	<h1>Forbidden!</h1>
        // 	${environment === 'development' ? `<pre>${decision.comment}</pre>` : ''}
        // `);
    }

    res.redirect(303, '/');
})

const server = app.listen(9081, () => addressMessage(server));