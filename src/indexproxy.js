const tableinfo = require('./sql');

exports.renderIndex = (req, res) => {
    tableinfo.getTablesInfo(req.query.tableName,(data) =>{
        res.render('index', {data: data});
    });
};