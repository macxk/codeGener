const dbutil = require('./dbutil');
// 表名及注释
exports.getTablesInfo = (tableName, callback) => {
    const conn = dbutil.createConn();
    let tableNameSql = `SELECT t.table_name AS name,t.TABLE_COMMENT AS comments 
                        \t\t\tFROM information_schema.\`TABLES\` t 
                        \t\t\tWHERE t.TABLE_SCHEMA = (select database())
                        \t\t\tAND t.TABLE_NAME not like 'act_%'
                        \t\t\tAND t.TABLE_NAME not like 'qrtz_%'`;
    if (tableName) {
        tableNameSql += `\t\t\tAND t.TABLE_NAME like '%${tableName}%'`;
    }
    tableNameSql += `\t\t\tORDER BY t.TABLE_NAME`;
    conn.connect();
    conn.query(tableNameSql, (err, results) => {
        if (err) {
            throw err;
        }
        callback(results);
    });
    conn.end();
};

// 表列信息
exports.getTableColInfo = (tableName, callback) => {
    const conn = dbutil.createConn();
    let tableColInfoSql = `SELECT
                        \tt.COLUMN_NAME AS NAME,
                        \t( CASE WHEN t.IS_NULLABLE = 'YES' THEN '1' ELSE '0' END ) AS isNull,
                        \t( t.ORDINAL_POSITION * 10 ) AS sort,
                        \tt.COLUMN_COMMENT AS comments,
                        \tt.COLUMN_TYPE AS jdbcType 
                        FROM
                        \tinformation_schema.\`COLUMNS\` t 
                        WHERE
                        \tt.TABLE_SCHEMA = ( SELECT DATABASE ( ) ) 
                        and t.TABLE_NAME ='${tableName}'
                        ORDER BY
                        \tt.ORDINAL_POSITION`;
    conn.connect();
    conn.query(tableColInfoSql, (err, fileds) => {
        if (err) {
            throw err;
        }
        callback(fileds);
    });
    conn.end();
};
