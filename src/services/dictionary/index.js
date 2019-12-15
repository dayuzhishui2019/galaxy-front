import StaticDict from "./static";
try {
    var XuiDictionary = NetPosaXUI.Dictionary;
    var inited = false;
    var initPromise = null;
    XuiDictionary.install(StaticDict);
    XuiDictionary.init = function () {
    };
    XuiDictionary.init();
} catch (e) {}
module.exports = window.$dictionary = XuiDictionary;