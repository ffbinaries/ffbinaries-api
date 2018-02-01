const requestLib = require('request');
const path = require('path');
const fse = require('fs-extra');
const _ = require('lodash');
const config = require('../config');

let GH_CACHE;
//
// // TODO: Don't replace dots in paths
// // TODO: Aggregate 404s
// function _logRequest(url) {
//   if (url === '/favicon.ico' || url === '/robots.txt') {
//     return;
//   }
//   const key = url.replace('.', '-') + '.' + fmt.time();
//   const LOGFILE = config.paths.logfile;
//
//   const data = fse.readJsonSync(LOGFILE) || {};
//   const currentCount = _.get(data, key) || 0;
//   _.set(data, key, currentCount + 1);
//
//   fse.writeJsonSync(LOGFILE, data);
// }
//
// // TODO: read https://api.github.com/repos/vot/ffbinaries-prebuilt/releases

function _replacePlaceholders(data, payload) {
  data = data.replace(/%%BASEURL%%/g, config.baseUrl);
  data = data.replace(/%%CURRENT_VERSION%%/g, config.currentVersion);

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
    data = fse.readFileSync(path.resolve(config.paths.json + '/' + file + '.json')).toString();
    data = _replacePlaceholders(data);
    data = JSON.parse(data);
  } catch (e) {
    console.log(e);
    data = '404';
  }
  return data;
}

// const preResponse = function (request, reply) {
//   _logRequest(request.url.path);
//   return reply.continue();
// };



function routes(app) {
  // server.ext('onPreResponse', preResponse);

  // Info pages
  app.get('/', function (req, res) {
    res.render('home');
  });

  app.get('/readme', function (req, res) {
    res.render('readme');
  });

  app.get('/downloads', function (req, res) {
    res.render('downloads');
  });


  // API V1 redirect /api requests to /api/v1
  app.get('/api', function (req, res) {
    res.render('api');
  });

  app.get('/api/versions', function (req, res) {
    res.redirect('api/v1');
  });

  app.get('/api/v1/versions', function (req, res) {
    res.redirect('/api/v1');
  });

  app.get('/api/version/:version', function (req, res) {
    res.redirect('/api/v1/version/' + req.params.version);
  });

  app.get('/api/latest', function (req, res) {
    res.redirect('api/v1/latest');
  });

  app.get('/api/v1/latest', function (req, res) {
    res.redirect('/api/v1/version/latest');
  });

  // API V1 versions
  app.get('/api/v1', function (req, res) {
    res.json(_getJson('index'));
  });

  app.get('/api/v1/version/latest', function (req, res) {
    res.json(_getJson(config.currentVersion));
  });

  app.get('/api/v1/version/:version', function (req, res) {
    res.json(_getJson(req.params.version));
  });



  app.get('/stats', function (req, res) {
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

    function objectToHtml (object) {
      var rtn = '<ul class="stats">';

      _.each(object, function (val, k) {
        rtn += '<li>';
        rtn += '<span class="count">' + val + '</span> ';
        rtn += '<code>' + k + '</code>';
        rtn += '</li>';
      });

      rtn += '</ul>';
      return rtn;
    }

    let payload = {
      // logApiRequests: JSON.stringify(logApiRequests, null, 2),
      logApiRequests: objectToHtml(logApiRequests),
      logApiRequestsTotal: _.sum(_.map(logApiRequests)),

      // logPageRequests: JSON.stringify(logPageRequests, null, 2),
      logPageRequests: objectToHtml(logPageRequests),
      logPageRequestsTotal: _.sum(_.map(logPageRequests)),
    };

    if (GH_CACHE && GH_CACHE.expiration > Date.now()) {
      payload.github = objectToHtml(GH_CACHE.data);
      payload.githubTotal = GH_CACHE.data.total;
      return res.render('stats', payload);
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
        _.each(ghData, function (release) {
          _.each(release.assets, function (val) {
            ghDataRtn[val.name] = val.download_count;
            ghDataRtn.total += val.download_count;
          });
        });

        // var ghDataString = JSON.stringify(ghDataRtn, null, 2);
        GH_CACHE = {
          expiration: Date.now() + (60 * 1000),
          data: ghDataRtn
        }

        payload.github = objectToHtml(ghDataRtn);
        payload.githubTotal = ghDataRtn.total;
      }

      res.render('stats', payload);
    });
  });
}

module.exports = routes;
