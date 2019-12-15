<template>
    <div class="dashboard-editor-container">

        <div style="font-size:18px;font-weight:bold;">
            今日数据统计
        </div>
        <panel-group ref="totalPanel" @handleSetLineChartData="handleSetLineChartData" />

        <el-row :gutter="32">
            <el-col :xs="24" :sm="24" :lg="8">
                <div class="chart-wrapper">
                    <pie-chart ref="pie" height="294px" />
                </div>
            </el-col>
            <el-col :xs="24" :sm="24" :lg="16"
                style="background:#fff;padding:16px 16px 0;margin-bottom:32px;position:relative;">
                <div class="line-chart-title">接入数据</div>
                <div class="data-count-item" style="position:absolute;top:20px;right:25px;font-size:14px;">
                    <span>今日接入数据量：</span>
                    <count-to :start-val="totalPre" :end-val="total" :duration="1500" class="card-panel-num" />
                </div>
                <line-chart height="280px" color="#67C23A" :legends="['接入数据']" :chart-data="accessLineData" />
            </el-col>
            <el-col v-for="item in transmitLineDatas" :key="item.name" :xs="24" :sm="24"
                :lg="transmitLineDatas.length==1?24:(transmitLineDatas.length==2?12:8)"
                style="background:#fff;padding:16px 16px 0;margin-bottom:32px;position:relative;">
                <div class="line-chart-title">转发平台：{{item.platformName}}</div>
                <div class="data-count-item" style="position:absolute;top:20px;right:25px;font-size:14px;">
                    <span>今日转发数据量：</span>
                    <span>{{item.total}}</span>
                    <!-- <count-to :start-val="item.totalPre" :end-val="item.total" :duration="1500" class="card-panel-num" /> -->
                </div>
                <line-chart height="280px" color="#409EFF" :legends="['转发平台1']" :chart-data="item.data" />
            </el-col>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import GithubCorner from "@/components/GithubCorner";
import PanelGroup from "./components/PanelGroup";
import LineChart from "./components/LineChart";
import RaddarChart from "./components/RaddarChart";
import PieChart from "./components/PieChart";
import BarChart from "./components/BarChart";
import TransactionTable from "./components/TransactionTable";
import TodoList from "./components/TodoList";
import BoxCard from "./components/BoxCard";
import CountTo from "vue-count-to";

const lineChartData = {
    newVisitis: {
        接入数据: [100, 120, 161, 134, 105, 160, 165]
    },
    messages: {
        转发平台1: [200, 192, 120, 144, 160, 130, 140]
    },
    purchases: {
        转发平台2: [80, 100, 121, 104, 105, 90, 100]
    },
    shoppings: {
        转发平台3: [130, 140, 141, 142, 145, 150, 160]
    }
};

export default {
    name: "DashboardAdmin",
    components: {
        GithubCorner,
        PanelGroup,
        LineChart,
        RaddarChart,
        PieChart,
        BarChart,
        TransactionTable,
        TodoList,
        BoxCard,
        CountTo
    },
    data() {
        return {
            totalPre: 0,
            total: 0,
            accessLineData: {
                接入数据: []
            },
            transmitLineDatas: []
        };
    },
    methods: {
        handleSetLineChartData(type) {
            this.lineChartData = lineChartData[type];
        },
        loop() {
            clearTimeout(window.$refreshStatisticsTimer);
            this.loadStatistics();
            window.$refreshStatisticsTimer = setInterval(() => {
                this.loadStatistics();
            }, 5000);
        },
        loadStatistics() {
            $http({
                url: "/api/statistics"
            }).then(res => {
                if (!res) {
                    return;
                }
                var totals = {};
                var types = ["face", "body", "vehicle", "nomotor"];
                var lines = {};
                Object.keys(res).forEach(category => {
                    var map = res[category].m || {};
                    if (category == "access") {
                        //接入
                        types.forEach(k => {
                            var list = map[k];
                            if (list) {
                                var count = list.reduce((res, v, i) => {
                                    lines[category] = lines[category] || [];
                                    lines[category][i] =
                                        (lines[category][i] || 0) + v;
                                    return res + v;
                                }, 0);
                                totals["access_total"] =
                                    (totals["access_total"] || 0) + count;
                                totals["access_" + k] =
                                    (totals["access_" + k] || 0) + count;
                            }
                        });
                    } else {
                        //转发
                        types.forEach(k => {
                            var list = map[k];
                            if (list) {
                                var count = list.reduce((res, v, i) => {
                                    lines[category] = lines[category] || [];
                                    lines[category][i] =
                                        (lines[category][i] || 0) + v;
                                    return res + v;
                                }, 0);
                                totals[category] =
                                    (totals[category] || 0) + count;
                                totals["transmit_" + k] =
                                    (totals["transmit_" + k] || 0) + count;
                            }
                        });
                    }
                });
                //total
                this.totalPre = this.total;
                this.total = totals["access_total"];
                //category
                this.$refs.totalPanel.render(totals);
                this.$refs.pie.render(totals);
                //line
                this.accessLineData = { 接入数据: lines.access || [] };
                this.transmitLineDatas = Object.keys(lines)
                    .filter(k => k != "access")
                    .sort()
                    .map(key => {
                        return {
                            name: key,
                            platformName: key.split("_")[1],
                            totalPre:0,
                            total:totals[key],
                            data: {
                                [key]: lines[key]
                            }
                        };
                    });
            });
        }
    },
    mounted() {
        this.loop();
    }
};
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
    padding: 32px;
    background-color: rgb(240, 242, 245);

    .github-corner {
        position: absolute;
        top: 0px;
        border: 0;
        right: 0;
    }

    .chart-wrapper {
        background: #fff;
        padding: 16px 16px 0;
        margin-bottom: 32px;
    }
}

@media (max-width: 1024px) {
    .chart-wrapper {
        padding: 8px;
    }
}
.line-chart-title {
    font-size: 14px;
    font-weight: bold;
}
</style>
