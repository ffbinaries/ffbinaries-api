const path = require('path');
const _ = require('lodash');
const fse = require('fs-extra');
const Hapi = require('hapi');
const constants = require('./constants')
const requestLib = require('request');

const VIEWSDIR = constants.VIEWSDIR;
const JSONDIR = constants.JSONDIR
const LOGFILE = constants.LOGFILE;
const BASEURL = constants.BASEURL;
const CURRENT_VERSION = constants.CURRENT_VERSION;

let GH_CACHE;

// ensure request log file
try {
  fse.accessSync(LOGFILE);
} catch (e) {
  fse.writeJsonSync(LOGFILE, {});
}

const server = new Hapi.Server();
server.connection({port: 3000});

function _currentTime () {
  const now = new Date();
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
  return date;
}

// TODO: Don't replace dots in paths
// TODO: Aggregate 404s
function _logRequest(url) {
  if (url === '/favicon.ico' || url === '/robots.txt') {
    return;
  }
  const key = url.replace('.', '-') + '.' + _currentTime();

  const data = fse.readJsonSync(LOGFILE) || {};
  const currentCount = _.get(data, key) || 0;
  _.set(data, key, currentCount + 1);

  fse.writeJsonSync(LOGFILE, data);
}

// TODO: read https://api.github.com/repos/vot/ffbinaries-prebuilt/releases
// to get stats + cache for 10 min
function _replacePlaceholders(data, payload) {
  data = data.replace(/%%BASEURL%%/g, BASEURL);
  data = data.replace(/%%CURRENT_VERSION%%/g, CURRENT_VERSION);

  if (payload) {
    _.each(payload, function (val, key) {
      data = data.replace('{{'+key+'}}', val);
    });
  }

  return data;
}

function _getJson(file) {
  let data;

  try {
    data = fse.readFileSync(path.resolve(JSONDIR + '/' + file + '.json')).toString();
    data = _replacePlaceholders(data);
    data = JSON.parse(data);
  } catch (e) {
    console.log(e);
    data = '404';
  }
  return data;
}

function _getView(file, payload) {
  let data;
  try {
    data = fse.readFileSync(VIEWSDIR + '/' + file + '.html').toString();
    data = _replacePlaceholders(data, payload);
  } catch (e) {
    console.log(e);
    data = '404';
  }
  return data;
}

const preResponse = function (request, reply) {
  _logRequest(request.url.path);
  return reply.continue();
};

server.ext('onPreResponse', preResponse);

// Info pages
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
    const requestLog = _getJson('../requestlog');
    let requestMap = {};
    _.each(requestLog, function (val, key) {
      requestMap[key] = _.sum(_.map(val));
    });
    var pagePaths = [
      "/",
      "/stats",
      "/readme"
    ];

    var logPageRequests = _.pick(requestMap, pagePaths);

    var logApiRequests = _.pickBy(requestMap, function (v, k) {
      return k.startsWith('/api')
    });

    let payload = {
      logApiRequests: JSON.stringify(logApiRequests, null, 2),
      logApiRequestsTotal: _.sum(_.map(logApiRequests)),

      logPageRequests: JSON.stringify(logPageRequests, null, 2),
      logPageRequestsTotal: _.sum(_.map(logPageRequests)),
    };

    if (GH_CACHE && GH_CACHE.expiration > Date.now()) {
      payload.github = GH_CACHE.data;
      var ghParsed = JSON.parse(GH_CACHE.data);
      payload.githubTotal = ghParsed.total;
      return reply(_getView('stats', payload));
    }

    const requestOpts = {
      url: 'https://api.github.com/repos/vot/ffbinaries-prebuilt/releases',
      headers: {
        'User-Agent': 'ffbinaries.com'
      }
    }

    requestLib(requestOpts, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var ghData = JSON.parse(body);
        var ghDataRtn = {
          total: 0
        };
        _.each(ghData[0].assets, function (val) {
          ghDataRtn[val.name] = val.download_count;
          ghDataRtn.total += val.download_count;
        });

        var ghDataString = JSON.stringify(ghDataRtn, null, 2);
        GH_CACHE = {
          expiration: Date.now() + (60 * 1000),
          data: ghDataString
        }

        payload.github = ghDataString;
        payload.githubTotal = ghDataRtn.total;
      }

      reply(_getView('stats', payload));
    })
  }
});

// API V1 redirect /api requests to /api/v1
server.route({
  method: 'GET',
  path: '/api',
  handler: function (request, reply) {
    reply.redirect('/api/v1');
  }
});

server.route({
  method: 'GET',
  path: '/api/versions',
  handler: function (request, reply) {
    reply.redirect('/api/v1');
  }
});

server.route({
  method: 'GET',
  path: '/api/latest',
  handler: function (request, reply) {
    reply.redirect('/api/v1/version/latest');
  }
});

server.route({
  method: 'GET',
  path: '/api/version/{version}',
  handler: function (request, reply) {
    reply.redirect('/api/v1/version/' + request.params.version);
  }
});


// API V1 versions
server.route({
  method: 'GET',
  path: '/api/v1',
  handler: function (request, reply) {
    reply(_getJson('index'));
  }
});

// versions
server.route({
  method: 'GET',
  path: '/api/v1/versions',
  handler: function (request, reply) {
    reply.redirect('/api/v1');
  }
});
server.route({
  method: 'GET',
  path: '/api/v1/latest',
  handler: function (request, reply) {
    reply.redirect('/api/v1/version/latest');
  }
});

server.route({
  method: 'GET',
  path: '/api/v1/version/latest',
  handler: function (request, reply) {
    reply(_getJson(CURRENT_VERSION));
  }
});

server.route({
  method: 'GET',
  path: '/api/v1/version/{version}',
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
