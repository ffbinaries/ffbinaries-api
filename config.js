const _ = require('lodash');
const path = require('path');
const fse = require('fs-extra');
const os = require('os');
const hbs = require('hbs');
const clarg = require('clarg');
const clOpts = clarg().opts;

const appPortRaw = clOpts.port || clOpts.p;
const appPortParsed = parseInt(appPortRaw, 10);
const appPort = (appPortRaw == appPortParsed) ? appPortParsed : 3000;

const appNetworkRaw = (clOpts.network || clOpts.n || '').trim();
const appNetwork = ['public', 'private'].indexOf(appNetworkRaw) === -1 ? 'local' : appNetworkRaw;

const networks = {
  public: '0',
  private: false,
  local: '127.0.0.1'
};

// fixing for DO setup
// const privateInterface = os.networkInterfaces()['eth1'];
// if (privateInterface) {
//   networks.private = _.map(_.find(privateInterface, {family: 'IPv4'}), 'address');
// }

const appNetworkInterface = networks[appNetwork];

const config = {
  baseUrl: clOpts.url || clOpts.u || 'http://localhost:' + appPort,
  appPort,
  appNetwork,
  appNetworkInterface,
  paths: {
    public: path.join(__dirname, 'public'),
    views: path.join(__dirname, 'views'),
    json: path.join(__dirname, 'json'),
    logfile: path.join(__dirname, 'requestlog.json')
  },
  views: {
    engine: hbs,
    partialsPath: path.join(__dirname, 'views/partials')
  },
  currentVersion: '6.1'
};

// ensure request log file
try {
  fse.accessSync(config.paths.logfile);
} catch (e) {
  fse.writeJsonSync(config.paths.logfile, {});
}

module.exports = config;
