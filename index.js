const path = require('path');
const _ = require('lodash');
const fse = require('fs-extra');
const Hapi = require('hapi');
const constants = require('./constants')

const VIEWSDIR = constants.VIEWSDIR;
const JSONDIR = constants.JSONDIR
const LOGFILE = constants.LOGFILE;
const BASEURL = constants.BASEURL;
const CURRENT_VERSION = constants.CURRENT_VERSION;

// ensure request log file
try {
  fse.accessSync(LOGFILE);
} catch (e) {
  fse.writeJsonSync(LOGFILE, {});
}

const server = new Hapi.Server();
server.connection({port: 3000});

function _currentTime () {
  var now = new Date();
  var date = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
  return date;
}


function _logRequest(url) {
  var key = url.replace('.', '-') + '.' + _currentTime();

  var data = fse.readJsonSync(LOGFILE) || {};
  var currentCount = _.get(data, key) || 0;
  _.set(data, key, currentCount + 1);

  fse.writeJsonSync(LOGFILE, data);
}

function _replacePlaceholders(data) {
  data = data.replace(/%%BASEURL%%/g, BASEURL);
  data = data.replace(/%%CURRENT_VERSION%%/g, CURRENT_VERSION);

  return data;
}

function _getJson(file) {
  try {
    var data = fse.readFileSync(path.resolve(JSONDIR + '/' + file + '.json')).toString();
    data = _replacePlaceholders(data);
    data = JSON.parse(data);
  } catch (e) {
    console.log(e);
    var data = '404';
  }
  return data;
}

function _getView(file) {
  try {
    var data = fse.readFileSync(VIEWSDIR + '/' + file + '.html').toString();
    data = _replacePlaceholders(data);
  } catch (e) {
    console.log(e);
    var data = '404';
  }
  return data;
}

const preResponse = function (request, reply) {
  _logRequest(request.url.path);
  return reply.continue();
};

server.ext('onPreResponse', preResponse);

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply(_getView('home'));
  }
});

server.route({
  method: 'GET',
  path: '/readme',
  handler: function (request, reply) {
    reply(_getView('readme'));
  }
});

server.route({
  method: 'GET',
  path: '/stats',
  handler: function (request, reply) {
    reply(_getJson('../requestlog'));
  }
});

// versions
server.route({
  method: 'GET',
  path: '/api',
  handler: function (request, reply) {
    reply(_getJson('index'));
  }
});

// versions
server.route({
  method: 'GET',
  path: '/api/versions',
  handler: function (request, reply) {
    reply(_getJson('versions'));
  }
});

server.route({
  method: 'GET',
  path: '/api/latest',
  handler: function (request, reply) {
    reply(_getJson(CURRENT_VERSION));
  }
});

server.route({
  method: 'GET',
  path: '/api/version/{version}',
  handler: function (request, reply) {
    reply(_getJson(request.params.version));
  }
});

server.start((err) => {
  if (err) {
    throw err;
  }
  console.log(`Server running at: ${server.info.uri}`);
});
