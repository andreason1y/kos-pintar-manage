module.exports = {
  source: 'dist',
  destination: 'dist',
  port: 3000,
  crawlSpa: true,
  skipThirdPartyRequests: true,
  include: ['/'],
  exclude: ['/app', '/login', '/beranda', '/dashboard'],
  onlyPages: true,
  minifyHtml: {
    collapseWhitespace: true,
    removeComments: true,
  },
  puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
};
