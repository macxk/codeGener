module.exports = {
    genPO(genInfo) {
        const tpl = `import com.sunvua.coeus.ext.common.po.BaseVersionControlPO;
import com.sunvua.coeus.ext.common.po.DbTableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@DbTableName("${genInfo.tableName}")
@Data
public class ${genInfo.modelName}PO extends BaseVersionControlPO {

${this.tplPOProperty(genInfo.properties)}
}`;

        //console.log(tpl);
        return tpl;
    },

    tplPOProperty(properties) {
        let propertiesTpl = '';
        for (let p of properties) {
            // 过滤系统字段
            if (this.notSystemProperty(p)) {
                propertiesTpl += `/**
                         * ${p.note}
                         */
                        private ${p.javaType} ${p.name};
                        `
            }
        }
        return propertiesTpl;
    },

    genController(genInfo) {
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
@Api(tags = "")
public class ${genInfo.modelName}Controller {

    @Autowired
    private ${genInfo.modelName}POService ${genInfo.modelVarName}POService;

    @ApiOperation("新增")
    @ApiImplicitParams({
            ${this.tplSwaggerParams(genInfo.properties)}
    })
    @SyncApiToDb("新增")
    @RequestMapping(path = "/add", method = RequestMethod.POST)
    public JsonResult add(@ApiIgnore @Validated ${genInfo.modelName}PO ${genInfo.modelVarName}PO){
        int res = ${genInfo.modelVarName}POService.baseSave(${genInfo.modelVarName}PO);
        return JsonResult.of(res > 0, "添加成功", "添加失败");
    }

    @ApiOperation("修改")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", dataType = "string", paramType = "form", required = true),
            ${this.tplSwaggerParams(genInfo.properties)}
    })
    @SyncApiToDb("修改")
    @RequestMapping(path = "/update", method = RequestMethod.POST)
    public JsonResult update(@ApiIgnore @Validated ${genInfo.modelName}PO ${genInfo.modelVarName}PO){
        int res = ${genInfo.modelVarName}POService.baseUpdate(${genInfo.modelVarName}PO);
        return JsonResult.of(res > 0, "更新成功", "更新失败");
    }

    @ApiOperation("删除")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "id", dataType = "string", paramType = "form", required = true)})
    @SyncApiToDb("删除")
    @RequestMapping(path = "/delete", method = RequestMethod.POST)
    public JsonResult deleteById(@NotNull(message = "id不能为空") String id){
        int res = ${genInfo.modelVarName}POService.baseDeleteById(id);
        return JsonResult.of(res > 0, "删除成功", "删除失败");
    }

    @ApiOperation("批量删除")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "ids", value = "id", dataType = "string", paramType = "form", required = true)})
    @SyncApiToDb("批量删除")
    @RequestMapping(path = "/deleteBatch", method = RequestMethod.POST)
    public JsonResult deleteByIds(@NotNull(message = "ids不能为空") String ids){
        int res = ${genInfo.modelVarName}POService.baseDeleteByIds(ids);
        return  JsonResult.of(res > 0, "删除成功", "删除失败");
    }
    
    @ApiOperation("列表")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "page", value = "页码", dataType = "string", paramType = "query", required = true),
            @ApiImplicitParam(name = "pageSize", value = "页面大小", dataType = "string", paramType = "query", required = true),
            @ApiImplicitParam(name = "orderBy", value = "排序", dataType = "string", paramType = "query", required = false),
            ${this.tplSwaggerParams(genInfo.properties)}
            })
    @ApiReturnArray(
            description = "列表",
            properties = {
                    @ApiReturnDataProperty(id = "0", name = "item", description = "列表信息", dataType = ArdDataTypeEnum.OBJECT),
                    ${this.tplSwaggerReturn(genInfo.properties)}
                    })
    @SyncApiToDb("列表")
    @RequestMapping(path = "/page", method = RequestMethod.GET)
    public JsonResult page(@ApiIgnore @NotNull(message = "页码不能为空")Integer page, 
                           @ApiIgnore @NotNull(message = "页面大小不能为空") Integer pageSize,
                           @ApiIgnore @RequestParam(name = "orderBy", required = false) String orderBy,
                           @ApiIgnore ${genInfo.modelName}PO params
                           ){
        Page helper = PageHelper.startPage(page, pageSize);
        if (Strings.isNotBlank(orderBy)) {
            helper.setOrderBy(orderBy);
        }
        List<${genInfo.modelName}PO> ${genInfo.modelVarName}POList = ${genInfo.modelVarName}POService.baseFuzzyFindListByParams(params);
        return JsonResult.success("查询成功" , ${genInfo.modelVarName}POList, helper.getTotal());
    }

}`;
        // console.log(tpl);
        return tpl;
    },

    tplSwaggerParams(properties) {
        let tpl = '';
        for (let property of properties) {
            if (this.notSystemProperty(property)) {
                tpl += `@ApiImplicitParam(name = "${property.name}", value = "${property.note}", dataType = "${this.javaType2SwaggerParamsType(property.javaType)}", paramType = "form", required = ${property.require}),
    `
            }
        }

        return tpl;
    },

    tplSwaggerReturn(properties) {
        let tpl = '';
        let index = 1;
        for (let property of properties) {
            if (this.notSystemProperty(property)) {
                tpl += `@ApiReturnDataProperty(id = "${index++}", name = "${property.name}", description = "${property.note}", dataType = ArdDataTypeEnum.${this.javaType2SwaggerReturnType(property.javaType)}, parentId = "0"),
    `
            }
        }
        return tpl;
    },

    genPOMapper(genInfo) {
        const tpl = `import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Component;

@Mapper
@Component
public interface ${genInfo.modelName}POMapper extends BasePOMapper<${genInfo.modelName}PO> {
}`;
        // console.log(tpl);
        return tpl;
    },

    genPOMapperXml(genInfo) {
        const tpl = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd" >
<mapper namespace="${genInfo.modelName}POMapper">

    <sql id="baseColumns">
        ${this.tplBaseColumn(genInfo.properties)}
    </sql>
    
    <!-- 插入 -->
    <insert id="baseSave">
        INSERT INTO ${genInfo.tableName}
        (id, create_time, create_by, update_time, update_by, remarks, sort
        ${this.tplSaveColumns(genInfo.properties)} )
        VALUES
        (#{id}, now(), #{createBy}, now(), #{updateBy}, #{remarks}, #{sort}
        ${this.tplSaveValues(genInfo.properties)})
    </insert>

    <!-- 批量插入 -->
    <insert id="baseSaveBatch">
        INSERT INTO ${genInfo.tableName}
        (id, create_time, create_by, update_time, update_by, remarks, sort
        ${this.tplSaveColumns(genInfo.properties)})
        VALUES
        <foreach collection="beans" index="index" item="item" open="" separator="," close="">
            (#{item.id}, now(), #{item.createBy}, now(), #{item.updateBy}, #{item.remarks}, #{item.sort}
            ${this.tplSaveBatchValues(genInfo.properties)})
        </foreach>
    </insert>

    <!-- 更新 -->
    <update id="baseUpdate">
        UPDATE ${genInfo.tableName}
        <set>
            update_time = now(),
            update_by = #{updateBy},
            ${this.tplUpdateItems(genInfo.properties)}
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
        FROM ${genInfo.tableName} t1
        WHERE id = #{id}
    </select>

    <!-- 根据id查询多个 -->
    <select id="baseFindListByIds" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName} t1
        WHERE id IN
        <foreach collection="ids" index="index" item="item" open="(" close=")" separator=",">
            #{item}
        </foreach>
    </select>

    <!-- 条件查询列表 -->
    <select id="baseFindListByParams" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/> t1
        FROM ${genInfo.tableName}
        <where>
            1 = 1
            ${this.tplFindParamsItems(genInfo.properties)}
        </where>
        ORDER BY sort ASC , create_time DESC
    </select>

    <!-- 条件模糊查询列表 -->
    <select id="baseFuzzyFindListByParams" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/> t1
        FROM ${genInfo.tableName}
        <where>
            1 = 1
        ${this.tplFuzzyFindaramsItems(genInfo.properties)}
        </where>
        ORDER BY sort ASC , create_time DESC
    </select>

    <!-- 查询所有 -->
    <select id="baseFindAll" resultType="${genInfo.modelName}PO">
        SELECT
        <include refid="baseColumns"/> 
        FROM ${genInfo.tableName} t1
        ORDER BY sort ASC , create_time DESC
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUnique" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName} where` + ' ${column_name}' + `= #{column_value}
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUniqueForMultiCol" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName}
        <where>
            <foreach collection="map.entrySet()" item="value" open=""  close="" index="key">
                AND ` + '${key}' + ` = #{value}
            </foreach>
        </where>
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUniqueForMultiColWithId" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName}
        <where>
            <foreach collection="map.entrySet()" item="value" open=""  close="" index="key">
                AND ` + '${key}' + ` = #{value}
            </foreach>
            <if test="id != null and id != ''">
                AND id = #{id}
            </if>
        </where>
    </select>

</mapper>`;

        return tpl;
    },


    tplBaseColumn(properties) {
        let tpl = '';
        for (let property of properties) {
            tpl += `t1.${property.colName} as ${property.name},`
        }
        return tpl.slice(0, tpl.length - 1);
    },

    tplSaveColumns(properties) {
        let tpl = ',';
        for (let property of properties) {
            if (this.notSystemCol(property)) {
                tpl += ` ${property.colName},`
            }
        }
        return tpl.slice(0, tpl.length - 1);
    },

    tplSaveValues(properties) {
        let tpl = ',';
        for (let property of properties) {
            if (this.notSystemProperty(property)) {
                tpl += ` #{${property.name}},`
            }
        }
        return tpl.slice(0, tpl.length - 1);
    },

    tplSaveBatchValues(properties) {
        let tpl = ',';
        for (let property of properties) {
            if (this.notSystemProperty(property)) {
                tpl += ` #{item.${property.name}},`
            }
        }
        return tpl.slice(0, tpl.length - 1);
    },

    tplUpdateItems(properties) {
        let tpl = '';
        for (let property of properties) {
            if (this.notSystemProperty(property)) {
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
    },

    tplFindParamsItems(properties) {
        let tpl = '';
        for (let property of properties) {
            if (this.notSystemProperty(property)) {
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
    },

    tplFuzzyFindaramsItems(properties) {
        let tpl = '';
        for (let property of properties) {
            if (this.notSystemProperty(property)) {
                if (property.javaType === `String`) {
                    tpl += `<if test="${property.name} != null and ${property.name} != ''">
                    AND ${property.colName} like CONCAT('%','` + '${' + property.name + `}','%')
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
    },

    genPOService(genInfo) {
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
    
     Logger logger = LoggerFactory.getLogger(${genInfo.modelName}POService.class);

    /**
     * 新建
     * @param ${genInfo.modelVarName}PO
     * @return
     */
    public int save(${genInfo.modelName}PO ${genInfo.modelVarName}PO) {
        try {
            String uuid = UUID.randomUUID().toString();
            ${genInfo.modelVarName}PO.setId(uuid);
            ${genInfo.modelVarName}PO.setDataTag(uuid);
            ${genInfo.modelVarName}PO.setVersion(1);
            ${genInfo.modelVarName}PO.setValidStartTime(DateUtils.formatDate(LocalDateTime.now(),"yyyy-MM-dd HH:mm:ss"));
            ${genInfo.modelVarName}PO.setValidEndTime("2099-12-31 23:59:59");
            ${genInfo.modelVarName}PO.setDataState(0);

            return baseSave(${genInfo.modelVarName}PO);
        } catch (Exception e) {
            logger.error("新增项目失败,{}", e.getMessage());
            throw new ManualRollbackException("新增失败");
        }
    }

}`;
    },

    genVO(genInfo) {
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
    
    ${this.tplPOProperty(genInfo.properties)}

}`;
    },


    javaType2SwaggerParamsType(javaType) {
        if (javaType === 'Integer' || javaType === 'BigDecimal') {
            return 'int'
        }
        return 'string';
    },

    javaType2SwaggerReturnType(javaType) {
        if (javaType === 'Integer' || javaType === 'BigDecimal') {
            return 'NUMBER'
        }
        return 'STRING';
    },

    notSystemProperty(property) {
        return ['id', 'createTime', 'createBy', 'updateTime', 'updateBy', 'remarks', 'sort', 'dataTag', 'validStartTime', 'validEndTime', 'version', 'dataState'].indexOf(property.name) === -1;
    },

    notSystemCol(property) {
        return ['id', 'create_time', 'create_by', 'update_time', 'update_by', 'remarks', 'sort', 'data_tag', 'valid_start_time', 'valid_end_time', 'version', 'data_state'].indexOf(property.colName) === -1;
    }

};


