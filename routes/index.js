var express = require('express');
var router = express.Router();

const indexproxy = require('../src/indexproxy');

/* GET users listing. */
router.get('/', function(req, res, next) {
  indexproxy.renderIndex(req, res);
  // res.render('index', { content: 'this is content!'})
});

module.exports = router;
