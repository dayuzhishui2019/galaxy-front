<template>
    <el-row :gutter="40" class="panel-group">
        <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
            <div class="card-panel" @click="handleSetLineChartData('newVisitis')">
                <div class="card-panel-icon-wrapper icon-people">
                    <svg-icon icon-class="peoples" class-name="card-panel-icon" />
                    <div class="card-panel-text">人脸</div>
                </div>
                <div class="card-panel-description">
                    <div class="data-count-item">
                        <span>接入：</span>
                        <count-to :start-val="faceInStart" :end-val="faceIn" :duration="duration" class="card-panel-num" />
                    </div>
                    <div class="data-count-item">
                        <span>转发：</span>
                        <count-to :start-val="0" :end-val="faceOut" :duration="duration" class="card-panel-num" />
                    </div>
                </div>
            </div>
        </el-col>
        <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
            <div class="card-panel" @click="handleSetLineChartData('newVisitis')">
                <div class="card-panel-icon-wrapper icon-message">
                    <svg-icon icon-class="peoples" class-name="card-panel-icon" />
                    <div class="card-panel-text">人体</div>
                </div>
                <div class="card-panel-description">
                    <div class="data-count-item">
                        <span>接入：</span>
                        <count-to :start-val="bodyInStart" :end-val="bodyIn" :duration="duration" class="card-panel-num" />
                    </div>
                    <div class="data-count-item">
                        <span>转发：</span>
                        <count-to :start-val="0" :end-val="bodyOut" :duration="duration" class="card-panel-num" />
                    </div>
                </div>
            </div>
        </el-col>
        <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
            <div class="card-panel" @click="handleSetLineChartData('newVisitis')">
                <div class="card-panel-icon-wrapper icon-money">
                    <svg-icon icon-class="peoples" class-name="card-panel-icon" />
                    <div class="card-panel-text">机动车</div>
                </div>
                <div class="card-panel-description">
                    <div class="data-count-item">
                        <span>接入：</span>
                        <count-to :start-val="vehicleInStart" :end-val="vehicleIn" :duration="duration" class="card-panel-num" />
                    </div>
                    <div class="data-count-item">
                        <span>转发：</span>
                        <count-to :start-val="0" :end-val="vehicleOut" :duration="duration" class="card-panel-num" />
                    </div>
                </div>
            </div>
        </el-col>
        <el-col :xs="12" :sm="12" :lg="6" class="card-panel-col">
            <div class="card-panel" @click="handleSetLineChartData('newVisitis')">
                <div class="card-panel-icon-wrapper icon-shopping">
                    <svg-icon icon-class="peoples" class-name="card-panel-icon" />
                    <div class="card-panel-text">非机动车</div>
                </div>
                <div class="card-panel-description">
                    <div class="data-count-item">
                        <span>接入：</span>
                        <count-to :start-val="nomotorInStart" :end-val="nomotorIn" :duration="duration" class="card-panel-num" />
                    </div>
                    <div class="data-count-item">
                        <span>转发：</span>
                        <count-to :start-val="0" :end-val="nomotorOut" :duration="duration" class="card-panel-num" />
                    </div>
                </div>
            </div>
        </el-col>
    </el-row>
</template>

<script>
import CountTo from "vue-count-to";

export default {
    components: {
        CountTo
    },
    data() {
        return {
            duration: 2000,
            faceInStart: 0,
            faceOutStart: 0,
            bodyInStart: 0,
            bodyOutStart: 0,
            vehicleInStart: 0,
            vehicleOutStart: 0,
            nomotorInStart: 0,
            nomotorOutStart: 0,
            faceIn: 0,
            faceOut: 0,
            bodyIn: 0,
            bodyOut: 0,
            vehicleIn: 0,
            vehicleOut: 0,
            nomotorIn: 0,
            nomotorOut: 0
        };
    },
    methods: {
        handleSetLineChartData(type) {
            this.$emit("handleSetLineChartData", type);
        },
        render(totals) {
            this.faceInStart = this.faceIn;
            this.faceIn = totals["access_face"]||0;
            this.faceOutStart = this.faceOut;
            this.faceOut = totals["transmit_face"]||0;
            this.bodyInStart = this.bodyIn;
            this.bodyIn = totals["access_body"]||0;
            this.bodyOutStart = this.bodyOut;
            this.bodyOut = totals["transmit_body"]||0;
            this.vehicleInStart = this.vehicleIn;
            this.vehicleIn = totals["access_vehicle"]||0;
            this.vehicleOutStart = this.vehicleOut;
            this.vehicleOut = totals["transmit_vehicle"]||0;
            this.nomotorInStart = this.nomotorIn;
            this.nomotorIn = totals["access_nomotor"]||0;
            this.nomotorOutStart = this.nomotorOut;
            this.nomotorOut = totals["transmit_nomotor"]||0;
        }
    },
    mounted() {}
};
</script>

<style lang="scss" scoped>
.panel-group {
    margin-top: 18px;

    .card-panel-col {
        margin-bottom: 32px;
    }

    .card-panel {
        height: 108px;
        cursor: pointer;
        font-size: 12px;
        position: relative;
        overflow: hidden;
        color: #666;
        background: #fff;
        box-shadow: 4px 4px 40px rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.05);

        .icon-people {
            color: #40c9c6;
        }

        .icon-message {
            color: #36a3f7;
        }

        .icon-money {
            color: #f4516c;
        }

        .icon-shopping {
            color: #34bfa3;
        }

        .card-panel-icon-wrapper {
            float: left;
            margin: 14px 0 0 14px;
            width: 80px;
            transition: all 0.38s ease-out;
            border-radius: 6px;
            text-align: center;
            .card-panel-text {
                font-size: 16px;
                display: block;
            }
        }

        .card-panel-icon {
            font-size: 40px;
            margin-bottom: 5px;
            display: block;
            margin: 10px auto;
        }

        .card-panel-description {
            float: right;
            font-weight: bold;
            margin: 30px;
            margin-left: 0px;

            .card-panel-text {
                line-height: 18px;
                color: rgba(0, 0, 0, 0.45);
                font-size: 16px;
                margin-bottom: 15px;
            }
            .data-count-item {
                margin-bottom: 10px;
                & > * {
                    display: inline-block;
                }
            }

            .card-panel-num {
                font-size: 20px;
            }
        }
    }
}

@media (max-width: 550px) {
    .card-panel-description {
        display: none;
    }

    .card-panel-icon-wrapper {
        float: none !important;
        width: 100%;
        height: 100%;
        margin: 0 !important;

        .svg-icon {
            display: block;
            margin: 14px auto !important;
            float: none !important;
        }
    }
}
</style>
