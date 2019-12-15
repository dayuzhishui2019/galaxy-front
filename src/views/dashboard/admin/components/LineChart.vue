<template>
    <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from "echarts";
require("echarts/theme/macarons"); // echarts theme
import resize from "./mixins/resize";

function two(v) {
    v += "";
    if (v.length < 2) {
        return "0" + v;
    }
    return v;
}

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
            default: "350px"
        },
        autoResize: {
            type: Boolean,
            default: true
        },
        color: {},
        legends: {},
        chartData: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            chart: null
        };
    },
    watch: {
        chartData: {
            deep: true,
            handler(val) {
                this.setOptions(val);
            }
        }
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
        initChart() {
            this.chart = echarts.init(this.$el, "macarons");
            this.setOptions(this.chartData);
        },
        setOptions({ expectedData, actualData } = {}) {
            this.chart.setOption({
                xAxis: {
                    data: (function() {
                        var list = [];
                        for (var i = 0; i < 60 * 24; i++) {
                            list.push(
                                `${two(Math.floor(i / 60))}:${two(i % 60)}`
                            );
                        }
                        return list;
                    })(),
                    boundaryGap: false,
                    axisTick: {
                        show: false
                    }
                },
                grid: {
                    left: 10,
                    right: 10,
                    bottom: 20,
                    top: 30,
                    containLabel: true
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: {
                        type: "cross"
                    },
                    padding: [5, 10]
                },
                yAxis: {
                    axisTick: {
                        show: false
                    },
                    max: function(value) {
                        return Math.floor(value.max * 1.1);
                    }
                },
                legend: {
                    data: this.legends
                },
                series: Object.keys(this.chartData).map(k => {
                    return {
                        name: "k",
                        itemStyle: {
                            normal: {
                                color: this.color,
                                lineStyle: {
                                    color: this.color,
                                    width: 2
                                }
                            }
                        },
                        areaStyle: {
                            normal: {
                                color: new echarts.graphic.LinearGradient(
                                    0,
                                    0,
                                    0,
                                    1,
                                    [
                                        {
                                            offset: 0,
                                            color: this.color
                                        },
                                        {
                                            offset: 1,
                                            color: "#ffe"
                                        }
                                    ]
                                )
                            }
                        },
                        smooth: true,
                        type: "line",
                        data: this.chartData[k],
                        animationDuration: 2800,
                        animationEasing: "cubicInOut"
                    };
                })
            });
        }
    }
};
</script>
