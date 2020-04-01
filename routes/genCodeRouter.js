var express = require('express');
var router = express.Router();
const gen = require('../src/gen');

router.get('/genCode', function (req, res, next) {
    gen.genCode(req, res);
});

module.exports = router;
