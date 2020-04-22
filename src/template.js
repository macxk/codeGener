module.exports = {
  /**
   * 生成PO类
   * @param {*} genInfo
   */
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

    return tpl;
  },

  tplPOProperty(properties) {
    let propertiesTpl = "";
    for (let p of properties) {
      // 过滤系统字段
      if (this.notSystemProperty(p)) {
        propertiesTpl += `/**
                         * ${p.note}
                         */
                        private ${p.javaType} ${p.name};
                        `;
      }
    }
    return propertiesTpl;
  },
  /**
   * 生成controller
   * @param {} genInfo 
   */
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
    public JsonResult add(@ApiIgnore @Validated ${genInfo.modelName}PO ${
      genInfo.modelVarName
    }PO){
        int res = ${genInfo.modelVarName}POService.baseSave(${
      genInfo.modelVarName
    }PO);
        return JsonResult.of(res > 0, "添加成功", "添加失败");
    }

    @ApiOperation("修改")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", dataType = "string", paramType = "form", required = true),
            ${this.tplSwaggerParams(genInfo.properties)}
    })
    @SyncApiToDb("修改")
    @RequestMapping(path = "/update", method = RequestMethod.POST)
    public JsonResult update(@ApiIgnore @Validated ${genInfo.modelName}PO ${
      genInfo.modelVarName
    }PO){
        int res = ${genInfo.modelVarName}POService.baseUpdate(${
      genInfo.modelVarName
    }PO);
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
        List<${genInfo.modelName}PO> ${genInfo.modelVarName}POList = ${
      genInfo.modelVarName
    }POService.baseFuzzyFindListByParams(params);
        return JsonResult.success("查询成功" , ${
          genInfo.modelVarName
        }POList, helper.getTotal());
    }

}`;

    return tpl;
  },

  tplSwaggerParams(properties) {
    let tpl = "";
    for (let property of properties) {
      if (this.notSystemProperty(property)) {
        tpl += `@ApiImplicitParam(name = "${property.name}", value = "${
          property.note
        }", dataType = "${this.javaType2SwaggerParamsType(
          property.javaType
        )}", paramType = "form", required = ${property.require}),
    `;
      }
    }

    return tpl;
  },

  tplSwaggerReturn(properties) {
    let tpl = "";
    let index = 1;
    for (let property of properties) {
      if (this.notSystemProperty(property)) {
        tpl += `@ApiReturnDataProperty(id = "${index++}", name = "${
          property.name
        }", description = "${
          property.note
        }", dataType = ArdDataTypeEnum.${this.javaType2SwaggerReturnType(
          property.javaType
        )}, parentId = "0"),
    `;
      }
    }
    return tpl;
  },

  /**
   * 生产POMapper
   * @param {*} genInfo 
   */
  genPOMapper(genInfo) {
    const tpl = `import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Component;

@Mapper
@Component
public interface ${genInfo.modelName}POMapper extends BasePOMapper<${genInfo.modelName}PO> {
}`;
   
    return tpl;
  },

  /**
   * 生成Mapper.xml
   * @param {} genInfo 
   */
  genPOMapperXml(genInfo) {
    const tpl =
      `<?xml version="1.0" encoding="UTF-8" ?>
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
        WHERE t1.id = #{id}
    </select>

    <!-- 根据id查询多个 -->
    <select id="baseFindListByIds" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName} t1
        WHERE t1.id IN
        <foreach collection="ids" index="index" item="item" open="(" close=")" separator=",">
            #{item}
        </foreach>
    </select>

    <!-- 条件查询列表 -->
    <select id="baseFindListByParams" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName} t1
        <where>
            1 = 1
            ${this.tplFindParamsItems(genInfo.properties)}
        </where>
        ORDER BY t1.sort ASC , t1.create_time DESC
    </select>

    <!-- 条件模糊查询列表 -->
    <select id="baseFuzzyFindListByParams" resultType="${genInfo.modelName}PO">
        SELECT 
        <include refid="baseColumns"/>
        FROM ${genInfo.tableName} t1
        <where>
            1 = 1
        ${this.tplFuzzyFindaramsItems(genInfo.properties)}
        </where>
        ORDER BY t1.sort ASC , t1.create_time DESC
    </select>

    <!-- 查询所有 -->
    <select id="baseFindAll" resultType="${genInfo.modelName}PO">
        SELECT
        <include refid="baseColumns"/> 
        FROM ${genInfo.tableName} t1
        ORDER BY t1.sort ASC , t1.create_time DESC
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUnique" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName} where` +
      " ${column_name}" +
      `= #{column_value}
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUniqueForMultiCol" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName}
        <where>
            <foreach collection="map.entrySet()" item="value" open=""  close="" index="key">
                AND ` +
      "${key}" +
      ` = #{value}
            </foreach>
        </where>
    </select>

    <!-- 校验唯一性 -->
    <select id="checkUniqueForMultiColWithId" resultType="int">
        SELECT count(0) FROM ${genInfo.tableName}
        <where>
            <foreach collection="map.entrySet()" item="value" open=""  close="" index="key">
                AND ` +
      "${key}" +
      ` = #{value}
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
    let tpl = "";
    for (let property of properties) {
      tpl += `t1.${property.colName} as ${property.name},`;
    }
    return tpl.slice(0, tpl.length - 1);
  },

  tplSaveColumns(properties) {
    let tpl = ",";
    for (let property of properties) {
      tpl += ` ${property.colName},`;
    }
    return tpl.slice(0, tpl.length - 1);
  },

  tplSaveValues(properties) {
    let tpl = ",";
    for (let property of properties) {
      tpl += ` #{${property.name}},`;
    }
    return tpl.slice(0, tpl.length - 1);
  },

  tplSaveBatchValues(properties) {
    let tpl = ",";
    for (let property of properties) {
      tpl += ` #{item.${property.name}},`;
    }
    return tpl.slice(0, tpl.length - 1);
  },

  tplUpdateItems(properties) {
    let tpl = "";
    for (let property of properties) {
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
    return tpl;
  },

  tplFindParamsItems(properties) {
    let tpl = "";
    for (let property of properties) {
      if (this.notSystemProperty(property)) {
        if (property.javaType === `String`) {
          tpl += `<if test="${property.name} != null and ${property.name} != ''">
                    AND t1.${property.colName} = #{${property.name}}
                </if>
                `;
        } else {
          tpl += `<if test="${property.name} != null">
                    AND t1.${property.colName} = #{${property.name}}
                </if>
                `;
        }
      }
    }
    return tpl;
  },

  tplFuzzyFindaramsItems(properties) {
    let tpl = "";
    for (let property of properties) {
      if (this.notSystemProperty(property)) {
        if (property.javaType === `String`) {
          tpl +=
            `<if test="${property.name} != null and ${property.name} != ''">
                    AND t1.${property.colName} like CONCAT('%','` +
            "${" +
            property.name +
            `}','%')
                </if>
                `;
        } else {
          tpl += `<if test="${property.name} != null">
                    AND t1.${property.colName} = #{${property.name}}
                </if>
                `;
        }
      }
    }
    return tpl;
  },

  /**
   * 生成POService
   * @param {*} genInfo 
   */
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

  /**
   * 生成VO
   * @param {} genInfo 
   */
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

  /**
   * 生成前端listView
   * @param {*} genInfo 
   */
  genListView(genInfo) {
    const tpl = `<template>
        <div class="sv-box">
            <s-table
                    :loading="loading"
                    :column-data="visibleColumns"
                    :data="tableData"
                    :highlight-row="highlight"
                    :on-row-sort="handleSortChange"
                    :on-selection-change="handleSelectionChange"
                    :pagination-total="paginationTotal"
                    :on-page-turning="handlePageTurning"
                    :on-search="handleSearch"
                    :on-reset="handleReset"
                    :paginationParams="paginationParams"
                    :searchable="searchable"
            >
                <template #operationbar>
                    <s-button
                            type="primary"
                            icon="md-add"
                            @click="handleAdd"
                            size="small"
                    >新建
                    </s-button>
                    <s-button
                            v-if="showDeleteBatchBtn"
                            icon="md-remove"
                            style="margin-left:5px;"
                            type="error"
                            @click="handleDeleteBatch"
                            size="small"
                    >删除
                    </s-button>
                    <visible-selector :items="columnData" v-model="visibleColumn" :on-change="handleVisibleChange"></visible-selector>
                </template>
                <template #searchbar>
                    <FormItem>
                        <!-- 查询条件 -->
                    </FormItem>
                </template>
            </s-table>
            <${genInfo.modelName}Form ref="${
      genInfo.modelVarName
    }Form" @success="load"></${genInfo.modelName}Form>
            <${genInfo.modelName}ShowInfoDialog ref="${
      genInfo.modelVarName
    }ShowInfoDialog"></${genInfo.modelName}ShowInfoDialog>
        </div>
    </template>
    
    <script>
        import ${genInfo.modelName}Form from "./${genInfo.modelName}Form";
        import ${genInfo.modelName}ShowInfoDialog from "./${
      genInfo.modelName
    }ShowInfoDialog";
    
        export default {
            name: "${genInfo.modelName}ShowInfoDialogList",
            components: {
                ${genInfo.modelName}ShowInfoDialogForm,
                ${genInfo.modelName}ShowInfoDialogShowInfoDialog
            },
            data() {
                return {
                    dialogParam: {
                        mode: 'add',
                        params: {}
                    },
                    apiPath: '/${genInfo.modelName}ShowInfoDialog/manage',
                    loading: false,
                    highlight: true,
                    visible: false,
                    paginationTotal: 0,
                    paginationSize: 15,
                    page: 1,
                    searchable: true,
                    searchParams: {
                        // 添加查询条件
                        orderBy: 'createTime desc'
                    },
                    paginationParams: {
                        page: 1,
                        pageSize: 15
                    },
                    columnData: [
    
                        {
                            type: 'selection',
                            width: '60',
                            align: 'center'
                        },
                        {
                            title: '第一列名称',
                            key: 'name',
                            className:'project-name',
                            sortable: true,
                            minWidth:200,
                            render: (h, params) => {
                                return h('div', [
                                    h('span', {
                                        props: {
                                            type: 'text',
                                            size: 'small'
                                        },
                                        on: {
                                            click: () => {
                                                this.handleInfoClick(params.row)
                                            }
                                        }
                                    }, params.row.name)
                                ]);
                            }
                        },
                       ${this.tplListTableCol(genInfo.properties)}
                        
                      {
                        title: '创建时间',
                        sortable: true,
                        key: 'createTime',
                        width: '110'
                      },
                      {
                        title: '创建人',
                        sortable: true,
                        key: 'createByName',
                        width: '110'
                      },
                        {
                            title: '修改时间',
                            sortable: true,
                            key: 'updateTime',
                            width: '110'
                        },
                        {
                            title: '修改人',
                            sortable: true,
                            key: 'updateByName',
                            width: '110'
                        },
                        {
                            title: '操作',
                            width: 130,
                            align: 'center',
                            fixed: 'right',
                            render: (h, params) => {
                                return h('div', [
                                    h('Button', {
                                        props: {
                                            type: 'text',
                                            size: 'small'
                                        },
                                        on: {
                                            click: () => {
                                                this.handleEditShow(params)
                                            }
                                        }
                                    }, '编辑'),
                                    h('Button', {
                                        props: {
                                            type: 'text',
                                            size: 'small'
                                        },
                                        on: {
                                            click: () => {
                                                this.handleDelete(params)
                                            }
                                        }
                                    }, '删除')
                                ]);
                            }
                        }
                    ],
                    visibleColumn:this.columnVisible() || [], // 添加缺省可见字段
                    tableData: [],
                    tableSelection: []
                }
            },
            computed: {
                showDeleteBatchBtn: function () {
                    return this.tableSelection && this.tableSelection.length > 0
                },
                visibleColumns() {
                    return this.columnData.filter(e =>
                        this.visibleColumn.indexOf(e.key) >= 0|| !e.key
                    );
                }
            },
            mounted() {
                this.loadSystemList();
                this.load()
            },
            methods: {
                columnVisible() {
                    let columnVisible = localStorage.getItem('${
                      genInfo.modelName
                    }ListColumnVisible');
                    if (columnVisible) {
                        return JSON.parse(columnVisible);
                    }
                    return null;
                },
                handleVisibleChange() {
                    localStorage.setItem('${
                      genInfo.modelName
                    }ListColumnVisible', JSON.stringify(this.visibleColumn));
                },
                load(params = {...this.paginationParams, ...this.searchParams}) {
                    this.$ajax.get(\`\${this.apiPath}/page\`, {
                        params
                    }).then(res => {
                        this.loading=true
                        if (res.success) {
                            this.loading = false
                            this.paginationTotal = res.total
                            this.tableData = res.data
                        } else {
                            this.loading = false
                            this.$Message.error(res.message);
                        }
                    })
                },
                handleSortChange(column) {
                    console.log(column)
                    if(column.order !=="normal"){
                        this.searchParams.orderBy =column.key + ' '+ column.order
                    }
                    this.load()
                },
                handleInfoClick(row) {
                    this.$refs.${genInfo.modelVarName}ShowInfoDialog.show(row);
                },
                handleSelectionChange(selection) {
                    this.tableSelection = selection
                },
                handlePageTurning(page) {
                    this.paginationParams.page = page.page
                    this.paginationParams.pageSize = page.pageSize
                    this.load()
                },
                handleAdd() {
                    this.dialogParam.mode = 'add'
                    this.dialogParam.params = {}
                    this.$refs.${
                      genInfo.modelVarName
                    }Form.show(this.dialogParam)
                },
                handleSearch() {
                    this.load()
                },
                handleReset() {
                    this.searchParams = {
                        // 添加查询条件
                        orderBy: 't1.create_time desc'
                    }
                    this.load()
                },
                handleDeleteBatch() {
                    this.$Modal.confirm({
                        title: '警告',
                        content: '<p>该操作将永久删除数据，是否继续？</p>',
                        onOk: () => {
                            this.$ajax.post(\`\${this.apiPath}/deleteBatch\`, {
                                ids: this.tableSelection.map(i => i.id).join(',')
                            }).then(res => {
                                if (res.success) {
                                    this.$Message.success(res.message)
                                    this.load()
                                    this.tableSelection=[];
                                } else {
                                    this.$Message.error(res.message);
                                }
                            })
                        },
                        onCancel: () => {
                            // do nothing
                        }
                    });
                },
                handleDelete(row) {
                    this.$Modal.confirm({
                        title: '警告',
                        content: '<p>该操作将永久删除数据，是否继续？</p>',
                        onOk: () => {
                            this.$ajax.post(\`\${this.apiPath}/delete\`, {
                                id: row.row.id
                            }).then(res => {
                                if (res.success) {
                                    this.$Message.success(res.message)
                                    this.load()
                                } else {
                                    this.$Message.error(res.message);
                                }
                            })
                        },
                        onCancel: () => {
                            // do nothing
                        }
                    });
                },
                handleEditShow(row) {
                    this.dialogParam.mode = 'edit'
                    this.dialogParam.params = {...row.row}
                    this.$refs.${
                      genInfo.modelVarName
                    }Form.show(this.dialogParam)
                }
    
            }
        }
    </script>
    <style>
        .project-name{cursor: pointer;}
        .project-name span:hover{
            color:#409EFF;
            text-decoration: underline;
        }
    </style>
    <style scoped>
        .sv-box {
            width: 100%;
            height: 100%;
            background: #fff;
        }
    </style>
    `;

    return tpl;
  },

  tplListTableCol(properties) {
    let propertiesTpl = "";
    for (let p of properties) {
      // 过滤系统字段
      if (this.notSystemProperty(p)) {
        propertiesTpl += ` {
                    title: '${p.note}',
                    key: '${p.name}',
                    width: '110',
                    sortable: true
                }, `;
      }
    }
    return propertiesTpl;
  },

  /**
   * 生成前端formView
   * @param {*} genInfo 
   */
  genFormView(genInfo) {
    const tpl = `<template>
        <s-dialog
                v-model="modal"
                :title="title"
                width="950px"
                @close="handleClose"
        >
            <div class="sv-dialog-content" v-if="modal">
                <Form ref="formCustom" :model="formCustom" :rules="ruleCustom" :label-width="130">
                        ${this.tplFormItems(genInfo.properties)}
                </Form>
            </div>
            <template slot="footer">
                <Button size="small" @click="handleClose">取消</Button>
                <Button type="primary" size="small" @click="handleSubmit">确定</Button>
            </template>
        </s-dialog>
    </template>
    
    <script>
        import validation from '../../config/validation.js'
        import rules from '@/config/rules'
        export default {
            name: "${genInfo.modelName}Form",
            components: {},
            data() {
                return {
                    modal: false,
                    mode: 'add',
                    displayUploadImg: process.env.VUE_APP_UPLOAD_URL,
                    apiPath: '', // 请求路径
                    formCustom: {},
                    ruleCustom: {
                        ${this.tplRuleCustoms(genInfo.properties)}
                    },
                }
            },
            computed: {
                title() {
                    return this.mode === 'add' ? '新增' : '编辑'
                }
            },
            methods: {
                show(params) {
                    this.modal = true
                    this.mode = params.mode
                    this.formCustom = {...params.params}
                  
                    if(params.mode === 'edit'){

                    }
                },
        
                handlePlatChange(){
    
                },
                /**
                 * 关闭事件
                 */
                handleClose() {
                    this.modal = false
                    this.formCustom = {}
                    this.$refs['formCustom'].resetFields();
                },
                /**
                 * 提交事件
                 */
                handleSubmit() {
                    this.$refs['formCustom'].validate((valid) => {
                      if (!valid) {
                        this.$Message.error('表单校验失败，请检查');
                        return;
                      }
                      let params = { ...this.formCustom }
                      let url = \`\${this.apiPath}/add\`
                      if (this.mode === 'edit') {
                        url = \`\${this.apiPath}/update\`
                      }
                      this.$ajax.post(url, params).then(res => {
                        if (res.success) {
                          this.$Message.success(res.message)
                          this.handleClose()
                          this.$emit('success')
                        } else {
                          this.$Message.error(res.message)
                        }
                      }).catch(err => {
                        console.log(err)
                        this.$Message.error('提交失败')
                      })
    
                    })
                }
            }
        }
    </script>
    
    <style scoped>
        .sv-content-title {
            border-bottom: 1px solid #e8e8e8;
            text-align: left;
            line-height: 35px;
            margin-bottom: 12px;
            font-size: 14px;
        }
        .form-item-wrap{
            width:280px;
            float:left
        }
        .fixedHeight{
            height:40px;
        }
    </style>`;

    return tpl;
  },

  tplFormItems(properties) {
    let propertiesTpl = "";
    for (let p of properties) {
      // 过滤系统字段
      if (this.notSystemProperty(p)) {
        propertiesTpl += ` {
                    <div class="form-item-wrap">
                        <FormItem label="${p.note}" prop="${p.name}">
                            
                        </FormItem>
                    </div>
                }, `;
      }
    }
    return propertiesTpl;
  },

  tplRuleCustoms(properties) {
    let propertiesTpl = "";
    for (let p of properties) {
      // 过滤系统字段
      if (this.notSystemProperty(p)) {
        propertiesTpl += ` 
                    ${p.name}: [
                        {required: ${p.require ? "true" : "false"}, ${
          p.javaType === "Integer" || p.javaType === "BigDecimal"
            ? "validator: rules.number"
            : "message: '" + p.note + "不能为空'"
        }, trigger: ''}
                    ],
                 `;
      }
    }
    return propertiesTpl;
  },

  /**
   * 生成前端showInfoView
   * @param {*} genInfo 
   */
  genShowInfoView(genInfo) {
    const tpl = `<template>
        <s-dialog
                v-model="modal"
                title="详情"
                width="800"
                footer-hide
                @close="handleClose"
        >
            <div class="sv-dialog-content">
                <div class="tab-title clearfix">
                    <div class="title" :class="[showTab==index+1?'active':'']" @click="handleShowTab(index+1)" v-for="(item,index) in titleList">
                        {{item}}
                    </div>
                </div>
                <div class="tab-content">
                    <div class="content content1 clearfix" v-if="showTab==1">
                       ${this.tplTabContent(genInfo.properties)}
                    </div>
                    <div class="content content2 clearfix" v-if="showTab==2">
                       <!-- tab2 content -->
                    </div>
                </div>
            </div>
        </s-dialog>
    </template>
    
    <script>
        export default {
            name: "ToolingTypeShowInfoDialog",
            components: {},
            data () {
                return {
                    displayUploadImg: process.env.VUE_APP_UPLOAD_URL,
                    apiPath: '',
                    modal:false,
                    data:{},
                    showTab:1,
                    titleList:[], // tab页标题
                    bigImgShow:false,
                    bigImgUrl:''
                }
            },
            methods: {
                show(row) {
                    this.data = {}
                    this.modal = true
                    this.showTab=1
                    this.data= {
                        ...row
                    };
                },
                handleClose () {
                    this.modal = false
                },
                handleShowTab(num){
                    this.showTab=num;
                }
            }
        }
    </script>
    
    <style scoped lang="less">
        .sv-dialog-content{
            max-height: 60vh;
            min-height: 50vh;
            overflow: hidden;
            position: relative;
        }
        .tab-title{
            height:30px;
            position: absolute;
            overflow: hidden;
            top:0;
            z-index: 1;
            .title{
                height:30px;
                float: left;
                padding:4px 10px;
                cursor: pointer;
                margin-right: 5px;
                border:1px solid #dcdee2;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                border-bottom: none;
                font-size: 13px;
            }
            .title.active{
                color: #409EFF;
                border-color:#409EFF;
                background-color: #fff;
                font-weight: bold;
                font-size: 14px;
            }
        }
        .tab-content{
            position: absolute;
            width:100%;
            top:29px;
            bottom:0;
            padding:15px;
            border:1px solid #dcdee2;
            overflow-y: auto;
        }
        .item {
            width: 345px;
            float: left;
            margin-bottom: 10px;
            margin-right: 15px;
    
            .item-title {
                float: left;
                text-align: right;
                width: 105px;
                font-size: 12px;
                margin-right: 10px;
            }
            .item-con {
                width: 230px;
                float: left;
                font-size: 12px;
                color: #111;
                word-break: break-all;
            }
        }
        .item1{
            width:100%!important;
            .item-con {
                width: 590px;
            }
        }
        .img-wrap{
            margin-bottom: 10px;
            .img-con{
                width:640px;
                float: left;
            }
            .img-title{
                width:80px;
                text-align: right;
                float: left;
                font-size: 12px;
                margin-right: 10px;
            }
        }
    </style>
    `;

    return tpl;
  },

  tplTabContent(properties) {
    let propertiesTpl = "";
    for (let p of properties) {
      // 过滤系统字段
      if (this.notSystemProperty(p)) {
        propertiesTpl += ` 
                <div class="item">
                    <span class="item-title">${p.note}:</span>
                    <span class="item-con">{{data.${p.name}}}</span>
                </div> 
            `;
      }
    }
    return propertiesTpl;
  },

  // ============================================= common ============================================================
  javaType2SwaggerParamsType(javaType) {
    if (javaType === "Integer" || javaType === "BigDecimal") {
      return "int";
    }
    return "string";
  },

  javaType2SwaggerReturnType(javaType) {
    if (javaType === "Integer" || javaType === "BigDecimal") {
      return "NUMBER";
    }
    return "STRING";
  },

  notSystemProperty(property) {
    return (
      [
        "id",
        "createTime",
        "createBy",
        "updateTime",
        "updateBy",
        "remarks",
        "sort",
        "dataTag",
        "validStartTime",
        "validEndTime",
        "version",
        "dataState",
      ].indexOf(property.name) === -1
    );
  },

  notSystemCol(property) {
    return (
      [
        "id",
        "create_time",
        "create_by",
        "update_time",
        "update_by",
        "remarks",
        "sort",
        "data_tag",
        "valid_start_time",
        "valid_end_time",
        "version",
        "data_state",
      ].indexOf(property.colName) === -1
    );
  },
};
