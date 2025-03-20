    // 修正后的模板配置
    window.ENTITY_TEMPLATES = {
        "mybatis_plus": `package {{basePackage}}.{{entityPackage}};

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.experimental.Accessors;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * {{tableComment}} {{tableName}}
 * @author {{author}}
 */
@Data
@Accessors(chain = true)
@TableName("{{tableName}}")
public class {{className}} {
{{#each fields}}
    /**
     * {{item.fieldComment}}
     */
    {{#item.isPrimary}}@TableId(value = "{{item.dbField}}", type = IdType.AUTO){{/item.isPrimary}}{{^item.isPrimary}}@TableField("{{item.dbField}}"){{/item.isPrimary}}
    private {{item.fieldType}} {{item.fieldName}};
{{/each}}
}`,
        "mapper": `package {{basePackage}}.{{mapperPackage}};

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import {{basePackage}}.{{entityPackage}}.{{className}};
import org.apache.ibatis.annotations.Mapper;

/**
 * {{tableComment}} {{tableName}} Mapper
 * @author {{author}}
 */
@Mapper
public interface {{className}}Mapper extends BaseMapper<{{className}}> {

}`,

        "service_interface": `package {{basePackage}}.{{servicePackage}};

import com.baomidou.mybatisplus.extension.service.IService;
import {{basePackage}}.{{entityPackage}}.{{className}};

/**
 * {{tableComment}} Service 接口
 * @author {{author}}
 */
public interface {{className}}Service extends IService<{{className}}> {

}`,

        "service_impl": `package {{basePackage}}.{{servicePackage}}.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import {{basePackage}}.{{entityPackage}}.{{className}};
import {{basePackage}}.{{mapperPackage}}.{{className}}Mapper;
import {{basePackage}}.{{servicePackage}}.{{className}}Service;
import org.springframework.stereotype.Service;

/**
 * {{tableComment}} Service 接口实现
 * @author {{author}}
 */
@Service
public class {{className}}ServiceImpl extends ServiceImpl<{{className}}Mapper, {{className}}> implements {{className}}Service {

}`,
        "mapper_xml": `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="{{basePackage}}.{{mapperPackage}}.{{className}}Mapper">
    <resultMap id="BaseResultMap" type="{{basePackage}}.{{entityPackage}}.{{className}}">
        {{#each fields}}
        <result column="{{item.dbField}}" property="{{item.fieldName}}" jdbcType="{{item.jdbcType}}"/>
        {{/each}}
    </resultMap>

    <sql id="Base_Column_List">
        {{#each fields}}{{dbField}}{{^isLast}}, {{/isLast}}{{/each}}
    </sql>
</mapper>`,
        "controller": `package {{basePackage}}.{{controllerPackage}};

import {{basePackage}}.{{entityPackage}}.{{className}};
import {{basePackage}}.{{servicePackage}}.{{className}}Service;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;

/**
 * {{tableComment}} 控制器
 * @author {{author}}
 */
@RestController
@RequestMapping("/{{restPath}}")
@Api(tags = "{{tableComment}}管理")
public class {{className}}Controller {

    private final {{className}}Service {{serviceInstanceName}};

    public {{className}}Controller({{className}}Service {{serviceInstanceName}}) {
        this.{{serviceInstanceName}} = {{serviceInstanceName}};
    }

    @PostMapping
    @ApiOperation("新增")
    public boolean create(@RequestBody {{className}} dto) {
        return {{serviceInstanceName}}.save(dto);
    }

    @DeleteMapping("/{id}")
    @ApiOperation("删除")
    public boolean delete(@PathVariable {{idType}} id) {
        return {{serviceInstanceName}}.removeById(id);
    }

    @PutMapping
    @ApiOperation("修改")
    public boolean update(@RequestBody {{className}} dto) {
        return {{serviceInstanceName}}.updateById(dto);
    }

    @GetMapping("/{id}")
    @ApiOperation("详情")
    public {{className}} get(@PathVariable {{idType}} id) {
        return {{serviceInstanceName}}.getById(id);
    }
}`,
        // 增强字段配置
        "_field_config": {
            timeMapping: {
                'create_time': 'INSERT',
                'update_time': 'INSERT_UPDATE'
            },
            descSuffix: 'Desc'
        }
    };

    // 增强型模板引擎
    /**
     * 简单模板引擎
     * 功能：支持变量、条件判断和循环
     */
    class TemplateEngine {
        /**
         * 渲染模板
         * @param {string} template - 模板字符串
         * @param {object} data - 数据对象
         * @returns {string} 渲染结果
         */
        static render(template, data, loop) {

            // 第一步：处理条件判断
            let result = this._processConditions(template, data, loop);

            // 第二步：处理循环
            result = this._processLoops(result, data);

            // 第三步：替换变量
            let re = this._replaceVariables(result, data);
            return re;
        }

        // 处理条件语句（如 {{#show}}...{{/show}}）
        static _processConditions(template, data, loop) {
            const CONDITION_REGEX = /\{\{([#^])([\.\w]+)\}\}(.*?)\{\{\/\2\}\}/gs;
            let currentResult;

            // 多次处理以支持嵌套
            do {
                currentResult = template;
                let flag = false
                template = template.replace(CONDITION_REGEX, (_, symbol, key, content) => {
                    key = key.replace('item.', '')

                    if (!loop && content.indexOf('item.') >= 0) {
                        return _
                    }
                    const hasKey = this._hasProperty(data, data);
                    console.log(key, hasKey)
                    if ( symbol === '#' && data[key]) {
                        flag = true
                        return this.render(content, data)
                    } else if (symbol === '^' && !flag) {
                        return this.render(content, data)

                    }
                    const shouldRender = symbol === '#' ? data[key] : false;
                    return shouldRender ? this.render(content, data) : '';
                });
            } while (template !== currentResult);

            return template;
        }

        // 处理循环（如 {{#each list}}...{{/each}}）
        static _processLoops(template, data) {

            const LOOP_REGEX = /\{\{#each (\w+)\}\}(.*?)\{\{\/each\}\}/gs;
            return template.replace(LOOP_REGEX, (_, key, content) => {
                const list = this._getValue(data, key) || [];
                if (!Array.isArray(list)) return '';
                return list.map(item => this.render(content, item, true)).join('');
            });
        }

        // 替换变量（如 {{name}} 或 {{user?.age}}）
        static _replaceVariables(template, data) {
            const VAR_REGEX = /\{\{(\??[\w\.]+)\}\}/g;
            return template.replace(VAR_REGEX, (_, key) => {
                // 处理可选链（user?.age）
                const keys = key.split(/\?\./);
                let value = data;
                for (let k of keys) {
                    k = k.replace('item.', '')
                    if (!value || !this._hasProperty(value, k)) return '';
                    value = value[k];
                }
                return value;
            });
        }

        // 辅助方法：安全判断属性是否存在
        static _hasProperty(obj, key) {
            return obj && Object.prototype.hasOwnProperty.call(obj, key);
        }

        // 辅助方法：安全获取属性值
        static _getValue(obj, key) {
            return this._hasProperty(obj, key) ? obj[key] : undefined;
        }
    }
