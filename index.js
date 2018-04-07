const express = require('express');
const config = require('./config');
const routes = require('./routes');
const fmt = require('./lib/fmt');

function startApp () {
  const app = express();
  app.disable('x-powered-by');

  // register hbs
  const hbs = config.views.engine;
  hbs.registerHelper('toLocaleString', function(num) {
    return num && num.toLocaleString ? num.toLocaleString() : '';
  });
  hbs.registerPartials(config.views.partialsPath);
  app.engine('html', hbs.__express);
  app.set('view engine', 'html');

  routes(app);

  if (config.appNetwork === 'private' && !config.appNetworkInterface) {
    console.log('Couldnt determine private interface - restricting to localhost');
    config.appNetworkInterface = '127.0.0.1';
  }
  // start app
  app.listen(config.appPort, config.appNetworkInterface, 0, function () {
    console.log(`[${fmt.date()} ${fmt.time()}] ffbinaries API listening on port ${config.appPort}`);
  });

  return app;
}

startApp();
