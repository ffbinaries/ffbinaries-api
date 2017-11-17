const path = require('path');

module.exports = {
  VIEWSDIR: path.join(__dirname, 'views'),
  JSONDIR: path.join(__dirname, 'json'),
  LOGFILE: path.join(__dirname, 'requestlog.json'),

  BASEURL: 'http://ffbinaries.com',
  // BASEURL: 'http://localhost:3000',

  CURRENT_VERSION: '3.4'
}
