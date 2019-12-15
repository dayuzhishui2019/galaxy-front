import NetPosaXUI from "@/xui/netposa-xui.js";
import "@/xui/netposa-xui.css";
import "@/xui/style/index.less";
import Validator from "@/xui/validator";
import ext from "@/xui/ext.js";

window.NetPosaXUI = NetPosaXUI;
window.Sunset = NetPosaXUI.Sunset;


export default function(Vue) {
    Vue.use(NetPosaXUI, {
        prefix: "xui"
    });
    Validator(NetPosaXUI);
    ext(NetPosaXUI);
};