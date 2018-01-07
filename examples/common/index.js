const { networkInterfaces } = require('os');
const fs = require('fs');
const qs = require('querystring');

const formTemplate = require('./formTemplate');

const getIps = () => {
    const ifaces = networkInterfaces();
    return Object.keys(ifaces).reduce((results = [], ifname) => {
        const localResults = ifaces[ifname].filter((iface) => {
            return 'IPv4' === iface.family && !iface.internal;
        }).map((iface) => iface.address);

        return results.concat(localResults);
    }, []);
};

const log = (...args) => console.log(...args);

const addressMessage = (server) => {
    log(`Started at:
${ getIps().map((ip) => `http://${ip}:${server.address().port}/`).join(' \n')}`)
}


const logoEndpoint = (req, res) => {
    fs.createReadStream('./examples/cleantalk-logo-main.png').pipe(res);
}

process.on('SIGINT', function () {
    process.exit();
});

const parseForm = req => new Promise(resolve => {
    let res = '';
    req.on('data', chunk => res += chunk.toString('utf-8'))
        .on('end', () => resolve(qs.parse(res)));
});


module.exports = {
    getIps,
    log,
    logoEndpoint,
    addressMessage,
    formTemplate,
    parseForm,
};