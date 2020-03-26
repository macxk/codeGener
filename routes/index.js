var express = require('express');
var router = express.Router();
const gen = require('../public/javascripts/gen');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(gen.genCode('t_achilles_improve_apply','AchillesImproveApply'));
  //res.render('content', { title: gen.genCode('t_achilles_improve_apply','AchillesImproveApply')});
});

module.exports = router;
