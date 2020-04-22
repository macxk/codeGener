const mysql = require('mysql');

exports.createConn = () => {
    return mysql.createConnection({
        host: '',
        user: '',
        password: '',
        database: '',
        port: 3306
    });
};