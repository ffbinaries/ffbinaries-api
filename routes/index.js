const requestLib = require('request');
const path = require('path');
const fse = require('fs-extra');
const _ = require('lodash');
const config = require('../config');
const fmt = require('../lib/fmt');

let GH_CACHE;

// TODO: Don't replace dots in paths
// TODO: Aggregate 404s
function _logRequest(url) {
  if (url === '/favicon.ico' || url === '/robots.txt') {
    return;
  }
  const key = url.replace('.', '-') + '.' + fmt.date();
  const LOGFILE = config.paths.logfile;

  const data = fse.readJsonSync(LOGFILE) || {};
  const currentCount = _.get(data, key) || 0;
  _.set(data, key, currentCount + 1);

  fse.writeJsonSync(LOGFILE, data);
}

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

function getFfmpegVersions() {
  const jsonIndex = _getJson('index');
  const versions = Object.keys(jsonIndex.versions);
  return _.without(versions, 'latest');
}


function routes(app) {
  // server.ext('onPreResponse', preResponse);

  // Info pages
  app.get('*', function (req, res, next) {
    _logRequest(req.url);
    next();
  });

  app.get('/', function (req, res) {
    res.render('home');
  });

  app.get('/readme', function (req, res) {
    const data = {
      versions: {
        api: require('../package.json').version,
        module: '1.0.3',
        ffmpeg: getFfmpegVersions().join(', ')
      }
    };
    res.render('readme', data);
  });

  app.get('/downloads', function (req, res) {
    const data = {
      versions: {}
    };

    var versions = getFfmpegVersions();
    _.each(versions, function (v) {
      data.versions[v] = _getJson(v);
    });

    res.render('downloads', data);
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
    if (GH_CACHE && GH_CACHE.expiration > Date.now()) {
      return res.render('stats', {github: GH_CACHE.data});
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

        GH_CACHE = {
          expiration: Date.now() + (60 * 1000),
          data: ghDataRtn
        }
      }

      res.render('stats', {github: GH_CACHE.data});
    });
  });
}

module.exports = routes;
