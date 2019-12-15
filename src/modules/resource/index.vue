<template>
    <div class="app-container">
        <div class="filter-container">
            <xui-filter :options="filterOptions" @filter="search"></xui-filter>
        </div>
        <div class="table-container">
            <div class="table-toolbar-container">
                <xui-toolbar :options="toolbarOptions"></xui-toolbar>
            </div>
            <xui-table ref="table" :options="tableOptions" @checked="onChecked"></xui-table>
        </div>
        <xui-modal ref="modal" title="资源编辑">
            <xui-form ref="form" :options="formOptions" @submit="save" @cancel="cancel"></xui-form>
        </xui-modal>
    </div>
</template>
<script>
import XLSX from "xlsx";
import Store from "./store";

var Excel_Header = ["国标ID", "资源名称", "类型", "纬度", "经度"];
var Excel_Header_Map = {
    国标ID: "gbId",
    资源名称: "name",
    类型: "type",
    纬度: "lat",
    经度: "lon"
};

export default {
    data() {
        return {
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
            toolbarOptions: [
                {
                    label: "新增",
                    color: "success",
                    icon : "el-icon-plus",
                    operate: () => {
                        this.edit();
                    }
                },
                {
                    label: "批量删除",
                    color: "danger",
                    icon : "el-icon-delete",
                    operate: () => {
                        if (this.checkedIds.length == 0) {
                            return $tip("请选择资源");
                        }
                        $confirm(
                            `确定删除选中的${this.checkedIds.length}个资源?`
                        ).then(() => {
                            this.remove(this.checkedIds.join(","));
                        });
                    }
                },
                {
                    label: "批量导入",
                    type: "file",
                    icon : "el-icon-upload2",
                    filter: (a, b, c) => {
                        this.readExcel(a.file).then(res => {
                            if (res && res.length > 0) {
                                this.batchSave(res);
                            }
                        });
                        return false;
                    }
                },
                {
                    label: "下载模板",
                    icon : "el-icon-download",
                    operate() {
                        import("@/vendor/Export2Excel").then(excel => {
                            const data = [];
                            excel.export_json_to_excel({
                                header: Excel_Header,
                                data,
                                filename: "资源导入模板",
                                autoWidth: true,
                                bookType: "xlsx"
                            });
                        });
                    }
                }
            ],
            formOptions: {
                cols: 2,
                fields: [
                    {
                        label: "国标id",
                        placeholder: "请输入国标id",
                        name: "gbId",
                        widget: "input",
                        clearable: false,
                        disabled(model) {
                            return !!model.id;
                        },
                        validate: {
                            required: true,
                            maxlength: 48
                        }
                    },
                    {
                        label: "名称",
                        placeholder: "请输入名称",
                        name: "name",
                        widget: "input",
                        validate: {
                            required: true,
                            maxlength: 48
                        }
                    },
                    {
                        label: "类型",
                        placeholder: "请选择类型",
                        name: "type",
                        widget: "select",
                        enum: "RESOURCE_TYPE",
                        validate: {
                            required: true
                        }
                    },
                    {
                        label: "经度",
                        placeholder: "请输入经度",
                        newline: true,
                        name: "lon",
                        widget: "input",
                        validate: {
                            number: true
                        }
                    },
                    {
                        label: "纬度",
                        placeholder: "请输入纬度",
                        name: "lat",
                        widget: "input",
                        validate: {
                            number: true
                        }
                    }
                ],
                format(model) {
                    if (!model.lon) {
                        model.lon = 0;
                    }
                    if (!model.lat) {
                        model.lat = 0;
                    }
                }
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
                    },
                    {
                        title: "经度",
                        name: "lon"
                    },
                    {
                        title: "纬度",
                        name: "lat"
                    },
                    {
                        title: "操作",
                        style: "width:160px;",
                        toolbar: {
                            size: "mini",
                            tools: [
                                {
                                    title: "修改",
                                    icon : "el-icon-edit",
                                    color: "warning",
                                    operate: record => {
                                        this.edit(record);
                                    }
                                },
                                {
                                    title: "删除",
                                    color: "danger",
                                    icon : "el-icon-delete",
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
                    return Store.list(filter);
                }
            }
        };
    },
    methods: {
        search(filter) {
            this.$refs.table.search(filter);
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
        batchSave(models) {
            Store.batchSave(models).then(() => {
                $tip("操作成功", "success");
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
        },
        readExcel(file) {
            return new Promise((resolve, reject) => {
                if (!this.isExcel(file)) {
                    this.$message.error(
                        "Only supports upload .xlsx, .xls, .csv suffix files"
                    );
                    reject(false);
                }
                const reader = new FileReader();
                reader.onload = e => {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const header = this.getHeaderRow(worksheet);
                    var results = XLSX.utils.sheet_to_json(worksheet);
                    if (results && results.length > 0) {
                        results = results.map(item => {
                            var t = {};
                            Excel_Header.forEach(key => {
                                t[Excel_Header_Map[key]] = item[key];
                            });
                            t.id = t.gbId;
                            return t;
                        });
                    }
                    resolve(results || []);
                };
                reader.onerror = e => {
                    reject(e);
                };
                reader.readAsArrayBuffer(file);
            });
        },
        getHeaderRow(sheet) {
            const headers = [];
            const range = XLSX.utils.decode_range(sheet["!ref"]);
            let C;
            const R = range.s.r;
            /* start in the first row */
            for (C = range.s.c; C <= range.e.c; ++C) {
                /* walk every column in the range */
                const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })];
                /* find the cell in the first row */
                let hdr = "UNKNOWN " + C; // <-- replace with your desired default
                if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
                headers.push(hdr);
            }
            return headers;
        },
        isExcel(file) {
            return /\.(xlsx|xls|csv)$/.test(file.name);
        }
    }
};
</script>