const mysql = require('mysql');

exports.createConn = () => {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'crrc_atalanta',
        port: 3306
    });
};