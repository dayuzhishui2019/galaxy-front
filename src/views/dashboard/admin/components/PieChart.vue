<template>
    <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from "echarts";
require("echarts/theme/macarons"); // echarts theme
import resize from "./mixins/resize";

export default {
    mixins: [resize],
    props: {
        className: {
            type: String,
            default: "chart"
        },
        width: {
            type: String,
            default: "100%"
        },
        height: {
            type: String,
            default: "300px"
        }
    },
    data() {
        return {
            chart: null
        };
    },
    mounted() {
        this.$nextTick(() => {
            this.initChart();
        });
    },
    beforeDestroy() {
        if (!this.chart) {
            return;
        }
        this.chart.dispose();
        this.chart = null;
    },
    methods: {
		render(totals){
			this.chart.setOption({
                series: [
                    {
                        name: "接入数据类型",
                        type: "pie",
                        radius: [0, 90],
                        center: ["50%", "45%"],
                        data: [
                            { value: totals["access_face"]||0, name: "人脸" },
                            { value: totals["access_body"]||0, name: "人体" },
                            { value: totals["access_vehicle"]||0, name: "机动车" },
                            { value: totals["access_nomotor"]||0, name: "非机动车" }
                        ].filter(item=>item.value>0),
                        animationEasing: "cubicInOut",
                        animationDuration: 2000
                    }
                ]
			})
		},
        initChart() {
            this.chart = echarts.init(this.$el, "macarons");

            this.chart.setOption({
                tooltip: {
                    trigger: "item",
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    left: "center",
                    bottom: "10",
                    data: ["人脸", "人体", "机动车", "非机动车"]
                },
                series: [
                    {
                        name: "WEEKLY WRITE ARTICLES",
                        type: "pie",
                        radius: [0, 95],
                        center: ["50%", "38%"],
                        data: [],
                        animationEasing: "cubicInOut",
                        animationDuration: 2000
                    }
                ]
            });
        }
    }
};
</script>
