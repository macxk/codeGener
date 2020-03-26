const tableinfo = require('./tableinfo');

exports.genCode = (tableName, modelName)=> {
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
                javaType: jdbcToJavaType(filed.jdbcType),
                colName: filed.NAME,
                jdbcType: filed.jdbcType,
                note: filed.comments})
        }

       return  genPO(genInfo);
       /* genController(genInfo);
        genPOMapper(genInfo);
        genPOMapperXml(genInfo);
        genPOService(genInfo);
        genVO(genInfo);*/
    })
};

function genPO(genInfo) {
   const tpl = `import com.sunvua.coeus.ext.common.po.BasePO;
import com.sunvua.coeus.ext.common.po.DbTableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@DbTableName("${genInfo.tableName}")
@Data
public class ${genInfo.modelName}PO extends BasePO {

${tplPOProperty(genInfo.properties)}
}`;

   //console.log(tpl);
    return tpl;
}

function tplPOProperty(properties) {
    let propertiesTpl = '';
    for (let p of properties) {
        // 过滤系统字段
        if (['id', 'createTime', 'createBy', 'updateTime', 'updateBy', 'remarks', 'sort'].indexOf(p.name) === -1) {
            propertiesTpl+= `/**
                         * ${p.note}
                         */
                        private ${p.javaType} ${p.name};
                        `
        }
    }
    return propertiesTpl;
}

function genController(genInfo) {
    const tpl = `import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import javax.validation.constraints.*;
import com.sunvua.coeus.common.util.BeanUtils;

import java.util.List;

@SyncApiToDb("")
@RestController
@RequestMapping("")
public class ${genInfo.modelName}Controller {

    @Autowired
    private ${genInfo.modelName}POService ${genInfo.modelVarName}POService;

    @SyncApiToDb("")
    @RequestMapping(path = "/add", method = RequestMethod.POST)
    public JsonResult add(@Validated ${genInfo.modelName}PO ${genInfo.modelVarName}PO){
        int res = ${genInfo.modelVarName}POService.baseSave(${genInfo.modelVarName}PO);
        return JsonResult.of(res > 0, "添加成功", "添加失败");
    }

    @SyncApiToDb("")
    @RequestMapping(path = "/update", method = RequestMethod.POST)
    public JsonResult update(@Validated ${genInfo.modelName}PO ${genInfo.modelVarName}PO){
        int res = ${genInfo.modelVarName}POService.baseUpdate(${genInfo.modelVarName}PO);
        return JsonResult.of(res > 0, "更新成功", "更新失败");
    }

    @SyncApiToDb("")
    @RequestMapping(path = "/delete", method = RequestMethod.POST)
    public JsonResult deleteById(@NotNull(message = "id不能为空") String id){
        int res = ${genInfo.modelVarName}POService.baseDeleteById(id);
        return JsonResult.of(res > 0, "删除成功", "删除失败");
    }

    @SyncApiToDb("")
    @RequestMapping(path = "/deleteBatch", method = RequestMethod.POST)
    public JsonResult deleteByIds(@NotNull(message = "ids不能为空") String ids){
        int res = ${genInfo.modelVarName}POService.baseDeleteByIds(ids);
        return  JsonResult.of(res > 0, "删除成功", "删除失败");
    }

    @SyncApiToDb("")
    @RequestMapping(path = "/page", method = RequestMethod.GET)
    public JsonResult page(@NotNull(message = "页码不能为空")Integer page, @NotNull(message = "页面大小不能为空") Integer pageSize, ${genInfo.modelName}PO params){
        PageHelper.startPage(page, pageSize);
        List<${genInfo.modelName}PO> ${genInfo.modelVarName}POList = ${genInfo.modelVarName}POService.baseFuzzyFindListByParams(params);
        return JsonResult.success("查询成功" , ${genInfo.modelVarName}POList, ((Page)${genInfo.modelVarName}POList).getTotal());
    }

}`;
    // console.log(tpl);
    return tpl;
}

function genPOMapper(genInfo) {
    const tpl = `import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Component;

@Mapper
@Component
public interface ${genInfo.modelName}POMapper extends BasePOMapper<${genInfo.modelName}PO> {
}`;
    // console.log(tpl);
    return tpl;
}

function genPOMapperXml(genInfo) {
    const tpl = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="${genInfo.modelName}POMapper">

    <sql id="baseColumn">
        ${tplBaseColumn(genInfo.properties)}
    </sql>
    
    <!-- 插入 -->
    <insert id="baseSave">
        INSERT INTO ${genInfo.tableName}
        (id, create_time, create_by, update_time, update_by, remarks, sort
        ${tplSaveColumns(genInfo.properties)} )
        VALUES
        (#{id}, now(), #{createBy}, now(), #{updateBy}, #{remarks}, #{sort}
        ${tplSaveValues(genInfo.properties)})
    </insert>

    <!-- 批量插入 -->
    <insert id="baseSaveBatch">
        INSERT INTO ${genInfo.tableName}
        (id, create_time, create_by, update_time, update_by, remarks, sort
        ${tplSaveColumns(genInfo.properties)})
        VALUES
        <foreach collection="beans" index="index" item="item" open="" separator="," close="">
            (#{item.id}, now(), #{item.createBy}, now(), #{item.updateBy}, #{item.remarks}, #{item.sort}
            ${tplSaveBatchValues(genInfo.properties)})
        </foreach>
    </insert>

    <!-- 更新 -->
    <update id="baseUpdate">
        UPDATE ${genInfo.tableName}
        <set>
            update_time = now(),
            update_by = #{updateBy},
            ${tplUpdateItems(genInfo.properties)}
            <if test="remarks != null">
                remarks = #{remarks},
            </if>
            <if test="sort != null">
                sort = #{sort}
            </if>
        </set>
        WHERE id = #{id}
    </update>

    <!-- 根据id删除 -->
    <delete id="baseDeleteById">
        DELETE FROM ${genInfo.tableName}
        WHERE id = #{id}
    </delete>

    <!-- 根据id批量删除 -->
    <delete id="baseDeleteByIds">
        DELETE FROM ${genInfo.tableName}
        WHERE id in
        <foreach collection="ids" index="index" item="item" open="(" close=")" separator=",">
            #{item}
        </foreach>
    </delete>

    <!-- 根据id查询单个 -->
    <select id="baseFindById" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName}
        WHERE id = #{id}
    </select>

    <!-- 根据id查询多个 -->
    <select id="baseFindListByIds" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName}
        WHERE id IN
        <foreach collection="ids" index="index" item="item" open="(" close=")" separator=",">
            #{item}
        </foreach>
    </select>

    <!-- 条件查询列表 -->
    <select id="baseFindListByParams" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName}
        <where>
            1 = 1
            ${tplFindParamsItems(genInfo.properties)}
        </where>
        ORDER BY sort ASC , create_time DESC
    </select>

    <!-- 条件模糊查询列表 -->
    <select id="baseFuzzyFindListByParams" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName}
        <where>
            1 = 1
        ${tplFuzzyFindaramsItems(genInfo.properties)}
        </where>
        ORDER BY sort ASC , create_time DESC
    </select>

    <!-- 查询所有 -->
    <select id="baseFindAll" resultType="${genInfo.modelName}PO">
        SELECT
        <include refid="baseColumns"/> 
        FROM ${genInfo.tableName}
        ORDER BY sort ASC , create_time DESC
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUnique" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName} where`+' ${column_name}' +`= #{column_value}
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUniqueForMultiCol" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName}
        <where>
            <foreach collection="map.entrySet()" item="value" open=""  close="" index="key">
                AND ` +'${key}'+ ` = #{value}
            </foreach>
        </where>
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUniqueForMultiColWithId" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName}
        <where>
            <foreach collection="map.entrySet()" item="value" open=""  close="" index="key">
                AND ` +'${key}'+ ` = #{value}
            </foreach>
            <if test="id != null and id != ''">
                AND id = #{id}
            </if>
        </where>
    </select>

</mapper>`;

    return tpl;
}

function tplBaseColumn(properties) {
    let tpl = '';
    for (let property of properties) {
        tpl += `${property.colName} as ${property.name},`
    }
   return  tpl.slice(0,tpl.length-2);
}

function tplSaveColumns(properties) {
    let tpl = ',';
    for (let property of properties) {
        if (['id', 'create_time', 'create_by', 'update_time', 'update_by', 'remarks', 'sort'].indexOf(property.colName) === -1) {
            tpl += ` ${property.colName},`
        }
    }
    return  tpl.slice(0,tpl.length-1);
}

function tplSaveValues(properties) {
    let tpl = ',';
    for (let property of properties) {
        if (['id', 'createTime', 'createBy', 'updateTime', 'updateBy', 'remarks', 'sort'].indexOf(property.name) === -1) {
            tpl += ` #{${property.name}},`
        }
    }
    return  tpl.slice(0,tpl.length-1);
}

function tplSaveBatchValues(properties) {
    let tpl = ',';
    for (let property of properties) {
        if (['id', 'createTime', 'createBy', 'updateTime', 'updateBy', 'remarks', 'sort'].indexOf(property.name) === -1) {
            tpl += ` #{item.${property.name}},`
        }
    }
    return  tpl.slice(0,tpl.length-1);
}

function tplUpdateItems(properties) {
    let tpl = '';
    for (let property of properties) {
        if (['id', 'createTime', 'createBy', 'updateTime', 'updateBy', 'remarks', 'sort'].indexOf(property.name) === -1) {
            if (property.javaType === `String`) {
                tpl += `<if test="${property.name} != null and ${property.name} != ''">
                 ${property.colName} = #{${property.name}},
                </if>
                `;
            } else {
                tpl += `<if test="${property.name} != null">
                ${property.colName} = #{${property.name}},
                </if>
                `;
            }

        }
    }
    return tpl;
}

function tplFindParamsItems(properties) {
    let tpl = '';
    for (let property of properties) {
        if (['id', 'createTime', 'createBy', 'updateTime', 'updateBy', 'remarks', 'sort'].indexOf(property.name) === -1) {
            if (property.javaType === `String`) {
                tpl += `<if test="${property.name} != null and ${property.name} != ''">
                    AND ${property.colName} = #{${property.name}}
                </if>
                `;
            } else {
                tpl += `<if test="${property.name} != null">
                    AND ${property.colName} = #{${property.name}}
                </if>
                `;
            }
        }
    }
    return tpl;
}

function tplFuzzyFindaramsItems(properties) {
    let tpl = '';
    for (let property of properties) {
        if (['id', 'createTime', 'createBy', 'updateTime', 'updateBy', 'remarks', 'sort'].indexOf(property.name) === -1) {
            if (property.javaType === `String`) {
                tpl += `<if test="${property.name} != null and ${property.name} != ''">
                    AND ${property.colName} like CONCAT('%','`+'${'+property.name +`}','%')
                </if>
                `;
            } else {
                tpl += `<if test="${property.name} != null">
                    AND ${property.colName} = #{${property.name}}
                </if>
                `;
            }
        }
    }
    return tpl;
}

function genPOService(genInfo) {
    return `import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ${genInfo.modelName}POService implements BasePOService<${genInfo.modelName}PO> {

    @Autowired
    private ${genInfo.modelName}POMapper ${genInfo.modelVarName}POMapper;

    @Override
    public BasePOMapper<${genInfo.modelName}PO> getMapper() {
        return ${genInfo.modelVarName}POMapper;
    }

}`;
}

function genVO(genInfo) {
    return `import lombok.Data;
import java.io.Serializable;

@Data
public class ${genInfo.modelName}VO implements Serializable {

    /**
     * 主键标识
     */
    private String id;
    /**
     * 创建时间
     */
    private String createTime;
    /**
     * 修改时间
     */
    private String updateTime;
    /**
     * 备注
     */
    private String remarks;
    /**
     * 排序
     */
    private Long sort;
    
    ${tplPOProperty(genInfo.properties)}

}`;
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

function jdbcToJavaType(jdbcType) {
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

/*function get() {
    genCode('t_achilles_improve_apply','AchillesImproveApply');
}*/
