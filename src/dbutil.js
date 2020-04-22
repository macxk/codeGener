const mysql = require('mysql');

exports.createConn = () => {
    return mysql.createConnection({
        host: '192.168.0.219',
        user: 'developer',
        password: 'sunvua@developer',
        database: 'crrc_tdms_dev',
        port: 3306
    });
};