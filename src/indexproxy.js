const tableinfo = require('./tableinfo');

exports.renderIndex = (req, res) => {
    tableinfo.getTablesInfo((data) =>{
       //  console.log(data);
        res.render('index', {data: data});
    });
};