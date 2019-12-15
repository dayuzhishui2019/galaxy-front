import NetPosaXUI from "./netposa-xui.js";
import "./netposa-xui.css";
import "./style/index.less";
import Validator from "./validator";
import ext from "./ext.js";

window.NetPosaXUI = NetPosaXUI;
window.Sunset = NetPosaXUI.Sunset;


module.exports = function(Vue) {
    Vue.use(NetPosaXUI, {
        prefix: "xui"
    });
    Validator(NetPosaXUI);
    ext(NetPosaXUI);
};