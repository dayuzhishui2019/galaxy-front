<template>
    <div class="app-container">
        <div class="table-container">
            <div class="table-toolbar-container">
                <xui-toolbar :options="toolbarOptions"></xui-toolbar>
            </div>
            <xui-table ref="table" :options="tableOptions" @checked="onChecked"></xui-table>
        </div>
        <xui-modal ref="modal" title="任务信息" :width="1000">
            <div style="width:100%;height:600px;position:relative;">
                <div style="position:absolute;top:0px;left:0px;bottom:0px;width:350px;border-right:1px solid #ddd;">
                    <xui-form ref="form" :options="formOptions" @submit="save" @cancel="cancel"></xui-form>
                </div>
                <div style="position:absolute;top:0px;left:350px;bottom:0px;right:0px;padding:10px;">
                    <div style="height:40px;">
                        <xui-input :options="searchOptions" @change="search"></xui-input>
                        <span
                            style="display:inline-block;float:right;vertical-align:middle;margin-top:11px;margin-left:15px;">已选择：{{checkedIds.length}}</span>
                        <xui-checkbox :options="{text:'全部资源'}" v-model="checkAll"
                            style="display:inline-block;float:right;margin-top:10px;margin-left:10px;"></xui-checkbox>
                    </div>
                    <xui-table ref="resourcetable" :options="resourceTableOptions" @checked="onChecked"></xui-table>
                </div>
            </div>
            <div style="text-align:center;padding:10px 0px;border-top:1px solid #ddd;">
                <xui-toolbar :options="formToolbarOptions"></xui-toolbar>
            </div>
        </xui-modal>
    </div>
</template>
<script>
import Store from "./store";
import ResourceStore from "../resource/store";

var Excel_Header = ["国标ID", "资源名称", "类型", "纬度", "经度"];
var Excel_Header_Map = {
    国标ID: "gbId",
    资源名称: "name",
    类型: "type",
    纬度: "lat",
    经度: "lon"
};

function buildComponentConfig(model) {
    return model.taskType == "1400server"
        ? {
              kafkaproducer_bootstrap: "kafka:9092",
              "1400server_viewLibId": model.viewLibId,
              "1400server_serverPort": model.serverPort,
              "1400server_openAuth": model.isAuth ? "true" : "false",
              "1400server_username": model.authUser,
              "1400server_password": model.authPassword,
              "1400server_sessionTimeout": model.sessionTimeout,
              "kafkaproducer_retry" : 3,
              "uploadimage_capacity" : 20,
              exportPorts: [model.serverPort]
          }
        : {
              kafkaconsumer_bootstrap: "kafka:9092",
              kafkaconsumer_batchSize: 20,
              kafkaconsumer_batchDelay: 50,
              kafkaconsumer_topics: "gat1400",
              kafkaconsumer_groupId: model.groupId,
              kafkaconsumer_fromEarliestOffset: "false",
              downloadimage_capacity : 20,
              "1400client_viewLibAddr": model.upIpPort,
              "1400client_userIdentify": model.viewLibId,
              "1400client_openAuth": model.isAuth,
              "1400client_keepaliveInterval": model.heartInterval,
              "1400client_username": model.authUser,
              "1400client_password": model.authPassword,
              "1400client_httpPoolsize" : 20,
              "1400client_platformId" : model.targetPlatformId,
              kafkaproducer_bootstrap: "kafka:9092"

          };
    eturn;
}

export default {
    data() {
        return {
            checkAll: false,
            checkedIds: [],
            filterOptions: {
                fields: [
                    {
                        name: "gbId",
                        widget: "input",
                        placeholder: "请输入国标ID"
                    },
                    {
                        name: "name",
                        widget: "input",
                        placeholder: "请输入资源名称"
                    },
                    {
                        name: "type",
                        widget: "select",
                        enum: "RESOURCE_TYPE",
                        placeholder: "请选择资源类型",
                        changeFilter: true
                    }
                ],
                searchButton: {
                    label: "搜索",
                    color: "primary",
                    signal: "SEARCH"
                }
            },
            searchOptions: {
                placeholder: "输入名称搜索"
            },
            toolbarOptions: [
                {
                    label: "新增",
                    color: "success",
                    icon: "el-icon-plus",
                    operate: () => {
                        this.edit();
                    }
                }
            ],
            formOptions: {
                cols: 1,
                fields: [
                    {
                        label: "任务名称",
                        placeholder: "请输入任务名称",
                        name: "name",
                        widget: "input",
                        clearable: false,
                        validate: {
                            required: true,
                            maxlength: 48
                        }
                    },
                    {
                        label: "任务类型",
                        placeholder: "请选择任务类型",
                        name: "taskType",
                        widget: "select",
                        enum: "TASK_TYPE",
                        validate: {
                            required: true
                        }
                    },
                    {
                        label: "管理端口",
                        placeholder: "请输入管理端口",
                        name: "managePort",
                        widget: "input",
                        validate: {
                            required: true,
                            port: true
                        }
                    },
                    {
                        label: "视图库ID",
                        placeholder: "请输入视图库ID",
                        name: "viewLibId",
                        widget: "input",
                        validate: {
                            required: true
                        }
                    },
                    {
                        label: "服务端口",
                        placeholder: "请输入服务端口",
                        name: "serverPort",
                        widget: "input",
                        premise(model) {
                            return model.taskType == "1400server";
                        },
                        validate: {
                            required: true
                        }
                    },
                    {
                        label: "视图库地址",
                        placeholder: "请输入上级视图库地址",
                        name: "upIpPort",
                        widget: "input",
                        premise(model) {
                            return model.taskType == "1400client";
                        },
                        validate: {
                            required: true
                        }
                    },
                    {
                        label: "平台名称",
                        placeholder: "请输入上级平台名称",
                        name: "targetPlatformId",
                        widget: "input",
                        premise(model) {
                            return model.taskType == "1400client";
                        },
                        validate: {
                            required: true
                        }
                    },
                    {
                        label: "开启认证",
                        name: "isAuth",
                        widget: "switch"
                    },
                    {
                        label: "认证用户名",
                        placeholder: "请输入用户名",
                        name: "authUser",
                        widget: "input"
                    },
                    {
                        label: "认证密码",
                        placeholder: "请输入密码",
                        name: "authPassword",
                        widget: "input"
                    },
                    {
                        label: "会话超时",
                        placeholder: "请输入会话超时（秒）",
                        name: "sessionTimeout",
                        widget: "input",
                        default : 90,
                        premise(model) {
                            return model.taskType == "1400server";
                        },
                        validate: {
                            integer: true
                        }
                    },
                    {
                        label: "心跳间隔",
                        placeholder: "请输入心跳间隔（秒）",
                        name: "heartInterval",
                        widget: "input",
                        default : 30,
                        premise(model) {
                            return model.taskType == "1400client";
                        },
                        validate: {
                            integer: true
                        }
                    },
                    {
                        label: "消费GROUP",
                        placeholder: "请输入消费GROUP",
                        name: "groupId",
                        premise(model) {
                            return model.taskType == "1400client";
                        },
                        widget: "input"
                    },
                    
                    // {
                    //     label: "批次大小",
                    //     placeholder: "请输入批次大小",
                    //     name: "batchSize",
                    //     widget: "input",
                    //     premise(model) {
                    //         return model.taskType == "1400client";
                    //     },
                    //     default: 20,
                    //     validate: {
                    //         integer: true
                    //     }
                    // },
                    // {
                    //     label: "批次延时",
                    //     placeholder: "请输入批次延时（毫秒）",
                    //     name: "batchDelay",
                    //     widget: "input",
                    //     premise(model) {
                    //         return model.taskType == "1400client";
                    //     },
                    //     default: 50,
                    //     validate: {
                    //         integer: true
                    //     }
                    // }
                ],
                cast: model => {
                    this.checkAll = !!model.allResource;
                    this.$refs.resourcetable.removeAllCheckeds();
                    model.resourceIds &&
                        model.resourceIds.forEach(id => {
                            this.$refs.resourcetable.checkRecord(true, {
                                id: id
                            });
                        });
                    try {
                        var config = JSON.parse(model.config);
                        if (config && config.rawConfig) {
                            Object.assign(model, JSON.parse(config.rawConfig));
                        }
                    } catch (e) {
                        console.log(e);
                    }
                },
                validate: () => {
                    var allResource = this.checkAll;
                    var resourceIds = this.checkedIds;
                    if (!allResource && this.checkedIds.length == 0) {
                        $tip("请选择资源", "warning");
                        throw new Error();
                    }
                },
                format: model => {
                    var allResource = this.checkAll;
                    var resourceIds = this.checkedIds;
                    if (allResource) {
                        resourceIds = [];
                    }
                    var config = buildComponentConfig(model);
                    delete model.rawConfig;
                    config.rawConfig = JSON.stringify(model);
                    return {
                        id: model.id,
                        name: model.name,
                        taskType: model.taskType,
                        managePort: model.managePort,
                        allResource: allResource,
                        resourceIds: resourceIds,
                        createTime: model.createTime,
                        config: JSON.stringify(config),
                        exportPorts: config.exportPorts
                    };
                },
                toolbar: false
            },
            tableOptions: {
                columns: [
                    {
                        title: "序号",
                        name: "_index",
                        style: "width:80px;",
                        format(a, b, c, d, e) {
                            return e + 1;
                        }
                    },
                    {
                        title: "任务名称",
                        name: "name"
                    },
                    {
                        title: "任务类型",
                        name: "taskType",
                        enum: "TASK_TYPE"
                    },
                    {
                        title: "资源数",
                        name: "type",
                        format(v, record) {
                            if (record.allResource) {
                                return "全部资源";
                            } else {
                                return (
                                    (record.resourceIds &&
                                        record.resourceIds.length) ||
                                    0
                                );
                            }
                        }
                    },
                    {
                        title: "更新时间",
                        name: "updateTime",
                        style: "width:200px;",
                        format: "DATETIME"
                    },
                    {
                        title: "创建时间",
                        name: "createTime",
                        style: "width:200px;",
                        format: "DATETIME"
                    },
                    {
                        title: "操作",
                        style: "width:160px;",
                        toolbar: {
                            size: "mini",
                            tools: [
                                {
                                    title: "修改",
                                    icon: "el-icon-edit",
                                    color: "warning",
                                    operate: record => {
                                        this.edit(record);
                                    }
                                },
                                {
                                    title: "删除",
                                    color: "danger",
                                    icon: "el-icon-delete",
                                    operate: record => {
                                        $confirm(
                                            `确定删除资源:${record.name}?`
                                        ).then(() => {
                                            this.remove(record.id);
                                        });
                                    }
                                }
                            ]
                        }
                    }
                ],
                pageNumberStart: 0,
                pageSize: 10,
                format: {
                    list: "",
                    count: "length",
                    currentPage: "pageNumber",
                    pageSize: "pageSize"
                },
                datasource(filter) {
                    return Store.list(filter);
                }
            },
            formToolbarOptions: [
                {
                    label: "保存",
                    color: "success",
                    operate: () => {
                        this.$refs.form.submit();
                    }
                },
                {
                    label: "取消",
                    operate: () => {}
                }
            ],
            resourceTableOptions: {
                columns: [
                    {
                        title: "序号",
                        name: "_index",
                        style: "width:80px;",
                        format(a, b, c, d, e) {
                            return e + 1;
                        }
                    },
                    {
                        title: "国标ID",
                        name: "gbId"
                    },
                    {
                        title: "资源名称",
                        name: "name"
                    },
                    {
                        title: "资源类型",
                        name: "type",
                        enum: "RESOURCE_TYPE"
                    }
                ],
                checked: {
                    key: "id"
                },
                pageNumberStart: 0,
                pageSize: 10,
                format: {
                    list: "list",
                    count: "total",
                    currentPage: "pageNumber",
                    pageSize: "pageSize"
                },
                lazy: true,
                datasource(filter) {
                    return ResourceStore.list(filter);
                }
            }
        };
    },
    methods: {
        search(keyword) {
            this.$refs.resourcetable.search({
                name: keyword
            });
        },
        edit(record) {
            this.$refs.form.reset(record);
            this.$refs.modal.open();
        },
        save(model) {
            Store.save(model).then(() => {
                $tip("操作成功", "success");
                this.$refs.modal.close();
                this.$refs.table.refresh();
            });
        },
        remove(ids) {
            Store.remove(ids).then(() => {
                $tip("操作成功", "success");
                this.$refs.table.refresh();
            });
        },
        cancel() {
            this.$refs.modal.close();
        },
        onChecked(records) {
            this.checkedIds = records.map(item => item.id);
        }
    }
};
</script>