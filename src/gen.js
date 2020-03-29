const contentDisposition = require('content-disposition');

const tableinfo = require('./sql');
const fileutil = require('./fileutil');
const tpl = require('./template');



exports.genCode = (req, res)=> {
    const tableName = req.query.tableName;
    const modelName = req.query.modelName;
    const genType = req.query.genType;
    tableinfo.getTableColInfo(tableName, fileds => {
        const genInfo = {
            tableName: '',
            modelName: '',
            modelVarName: '',
            properties: []
        };
        genInfo.tableName = tableName;
        genInfo.modelVarName = modelName ? getModelVarName(modelName) : getModelVarName(tableName);
        genInfo.modelName = modelName || getModelName(tableName);
        for (let filed of fileds) {
            genInfo.properties.push({
                name: line2Hump(filed.NAME),
                javaType: jdbc2JavaType(filed.jdbcType),
                colName: filed.NAME,
                jdbcType: filed.jdbcType,
                note: filed.comments,
                require: filed.isNull === '1'
            })
        }

       switch (genType) {
           case 'c': {
               res.set('Content-Disposition', contentDisposition(`${genInfo.modelName}Controller.java`));
               res.end(fileutil.str2buff(tpl.genController(genInfo)));
           } break;

           case 's': {
               res.set('Content-Disposition', contentDisposition(`${genInfo.modelName}POService.java`));
               res.end(fileutil.str2buff(tpl.genPOService(genInfo)));
           } break;

           case 'p': {
               res.set('Content-Disposition', contentDisposition(`${genInfo.modelName}PO.java`));
               res.end(fileutil.str2buff(tpl.genPO(genInfo)));
           } break;

           case 'v': {
               res.set('Content-Disposition', contentDisposition(`${genInfo.modelName}VO.java`));
               res.end(fileutil.str2buff(tpl.genVO(genInfo)));
           } break;

           case 'm': {
               res.set('Content-Disposition', contentDisposition(`${genInfo.modelName}POMapper.java`));
               res.end(fileutil.str2buff(tpl.genPOMapper(genInfo)));
           } break;

           case 'x': {
               res.set('Content-Disposition', contentDisposition(`${genInfo.modelName}POMapper.xml`));
               res.end(fileutil.str2buff(tpl.genPOMapperXml(genInfo)));
           } break;

       }

    })
};


function jdbc2JavaType(jdbcType) {
    if (startsWithIgnoreCase(jdbcType, "CHAR")
        || startsWithIgnoreCase(jdbcType, "VARCHAR")
        || startsWithIgnoreCase(jdbcType, "NARCHAR")
        || startsWithIgnoreCase(jdbcType, "TEXT")
    ){
        return "String";
    }else if (startsWithIgnoreCase(jdbcType, "DATETIME")
        || startsWithIgnoreCase(jdbcType, "DATE")
        || startsWithIgnoreCase(jdbcType, "TIMESTAMP")){
        // return  "java.util.Date";
        return "String"
    }else if (startsWithIgnoreCase(jdbcType, "BIGINT")
        || startsWithIgnoreCase(jdbcType, "INT")
        || startsWithIgnoreCase(jdbcType, "TINYINT")){
        return "Integer";
    }else if (startsWithIgnoreCase(jdbcType, "NUMBER")
        || startsWithIgnoreCase(jdbcType, "DECIMAL")) {
        return "BigDecimal";
    }
}

function startsWithIgnoreCase(str1, str2) {
    str1 = str1.toUpperCase();
    str2 = str2.toUpperCase();
    return str1.indexOf(str2) === 0;
}

function getModelVarName(modelName) {
    return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function getModelName(tableName) {
    let str = line2Hump(tableName.toLowerCase());
    return  str.charAt(0).toUpperCase() + str.slice(1);
}

// 下划线转驼峰
function line2Hump(name) {
    return name.replace(/_(\w)/g, function(all, letter){
        return letter.toUpperCase();
    });
}
