import "@/vendor/base64.js";
import MD5 from "@/vendor/md5.js";
// import flv from 'flv.js';

function base64Img2Blob(code) {
    var parts = code.split(";base64,");
    var contentType = parts[0].split(":")[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);
    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], {
        type: contentType
    });
}

function downloadFile(fileName, blob) {
    var aLink = document.createElement("a");
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    // var evt = document.createEvent("HTMLEvents");
    // evt.initEvent("click", false, false);
    // aLink.dispatchEvent(evt);
    aLink.click();
}

export default (window.$tools = {
    setCookie(name, value, myDay) {
        var oDate = new Date();
        oDate.setDate(oDate.getDate() + myDay);
        document.cookie = name + "=" + value + ";expires=" + oDate;
    },
    setLocalValue(itemName, itemValue) {
        //存储，IE6~7 cookie 其他浏览器HTML5本地存储
        if (window.localStorage) {
            window.localStorage.setItem(itemName, JSON.stringify(itemValue));
        } else {
            window.Cookie.write(itemName, JSON.stringify(itemValue));
        }
    },
    /**
     * [removeLocalValue 移除本地存储]
     * @param {string} [itemName] [存储名称]
     * @return null
     */
    removeLocalValue(itemName) {
        //存储，IE6~7 cookie 其他浏览器HTML5本地存储
        if (window.localStorage) {
            window.localStorage.removeItem(itemName);
        } else {
            /* -1 天后过期即删除 */
            Toolkits.setCookie(name, 1, -1);
        }
    },
    //获取cookie
    getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) != -1) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    },
    delCookie(key) {
        var date = new Date();
        date.setTime(date.getTime() - 1);
        var delValue = this.getCookie(key);
        if (!!delValue) {
            document.cookie = key + '=' + delValue + ';expires=' + date.toGMTString();
        }
    },
    /**
     * [getLocalValue 获取本地存储【JSON转换后的数据】]
     * @param  {[String]} item [存储名称]   必填
     * @param  {[String]} key [数据键值]   非必填
     * @return null
     */
    getLocalValue(item, key) {
        if (key == undefined) {
            return JSON.parse(
                window.localStorage ?
                localStorage.getItem(item) :
                Cookie.read(item)
            );
        } else {
            return JSON.parse(
                window.localStorage ?
                localStorage.getItem(item) :
                Cookie.read(item)
            )[key];
        }
    },
    /**
     * 将日期设置为当天开始
     */
    adjustDateToStart(time) {
        var date = new Date(time);
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date.getTime();
    },
    /**
     * 将日期设置为当天结束
     */
    adjustDateToEnd(time) {
        var date = new Date(time);
        date.setHours(23);
        date.setMinutes(59);
        date.setSeconds(59);
        date.setMilliseconds(999);
        return date.getTime();
    },
    /**
     * 下载文件到本地
     * @param {*} filename
     * @param {*} src
     */
    downloadFile(filename, blob) {
        downloadFile(filename, blob);
    },
    /**
     * 下载图片到本地
     * @param {*} filename
     * @param {*} src
     */
    downloadImg(filename, src) {
        var img = new Image();
        img.src = src;
        img.onload = function () {
            img.onload = null;
            var cvs = document.createElement("canvas");
            cvs.width = img.width;
            cvs.height = img.height;
            var ctx = cvs.getContext("2d");
            ctx.drawImage(img, 0, 0);
            downloadFile(
                filename || "img.png",
                base64Img2Blob(cvs.toDataURL())
            );
        };
    },
    /**
     * 裁剪图片
     */
    cuteImage(src, locations) {
        return new Promise(resolve => {
            var img = new Image();
            img.src = src;
            var featureImgs = [];
            img.onload = function () {
                img.onload = null;
                var cvs = document.createElement("canvas");
                cvs.width = img.width;
                cvs.height = img.height;
                var ctx = cvs.getContext("2d");
                locations.forEach(lc => {
                    var lcs = lc.split(","),
                        sx = +lcs[0],
                        sy = +lcs[1],
                        w = +lcs[2] - sx,
                        h = +lcs[3] - sy;
                    if (cvs.width != w) {
                        cvs.width = w;
                    }
                    if (cvs.height != h) {
                        cvs.height = h;
                    }
                    ctx.drawImage(img, sx, sy, w, h, 0, 0, w, h);
                    featureImgs.push(cvs.toDataURL());
                });
                resolve(featureImgs);
            };
        });
    },
    /**
     * 标注图片
     */
    markImage(src, markerSrc, locations) {
        return new Promise(resolve => {
            var count = 0;
            var img = new Image();
            img.src = src;
            var markerImg = new Image();
            markerImg.src = markerSrc;

            img.onload = function () {
                count++;
                if (count == 2) {
                    mark();
                }
            };
            markerImg.onload = function () {
                count++;
                if (count == 2) {
                    mark();
                }
            };

            function mark() {
                img.onload = null;
                var cvs = document.createElement("canvas");
                cvs.width = img.width;
                cvs.height = img.height;
                var ctx = cvs.getContext("2d");
                ctx.drawImage(img, 0, 0, img.width, img.height);
                var points = [];
                locations.forEach(lc => {
                    var lcs = lc.split(","),
                        sx = +lcs[0],
                        sy = +lcs[1],
                        w = +lcs[2] - sx,
                        h = +lcs[3] - sy;
                    var markerHalf = markerImg.width / 2;
                    var half = w / 2;
                    ctx.drawImage(
                        markerImg,
                        0,
                        0,
                        markerImg.width,
                        markerImg.height,
                        sx,
                        sy,
                        w,
                        w
                    );
                });
                resolve(cvs.toDataURL());
            }
        });
    },
    /**
     * 合并iconClass
     * @param {*} modulesGrounp 模块
     * @param {*} meuns 菜单
     */
    menuIconsMerge(modulesGrounp, meuns) {
        var modules = [],
            mergeMeuns = [],
            moduleIconsMap = {};
        if (!modulesGrounp || !meuns) {
            return;
        }
        modulesGrounp.map(item => {
            modules.push(...item.modules);
        }); //获取全部模块
        moduleIconsMap = modules.reduce((moduleIconsMap, item) => {
            moduleIconsMap[item.name] = item.iconClass || "";
            return moduleIconsMap;
        }, {});
        //合并图标
        mergeMeuns = meuns.map(item => {
            if (item.module) {
                item.iconClass = moduleIconsMap[item.module] || item.iconClass;
            }
            return item;
        });
        return mergeMeuns;
    },
    /**
     * [url地址格式化] -图片展示处理
     * @param  {[String]} [大图sceneImg、小图traitImg、坐标location]
     * @return {[string]} [格式化后的地址]
     */
    convertImg(sceneImg, location, traitImg, height) {
        //是否默认优先展示大图+坐标
        if ($config.getConfig("warehouse", "imgLoction") === 0) {
            if (!!location && !!sceneImg) {
                // 大图逻辑-大图+坐标
                return Toolkits.getNewImgCutUrl(sceneImg, location, height);
            } else if (!!traitImg) {
                // 小图-特征图逻辑
                return Toolkits.getNewImgCutUrl(traitImg, null, height);
            } else if (!!sceneImg) {
                // 大图逻辑-大图+坐标
                return Toolkits.getNewImgCutUrl(sceneImg, null, height);
            } else {
                // 图片为空情况
                return "";
            }
        } else {
            //默认优先使用小图进行展示
            if (!!traitImg) {
                // 小图-特征图逻辑
                return Toolkits.getNewImgCutUrl(traitImg, null, height);
            } else if (!traitImg && !sceneImg) {
                // 图片为空情况
                return "";
            } else {
                // 大图逻辑-大图+坐标
                return Toolkits.getNewImgCutUrl(sceneImg, location, height);
            }
        }
    },
    toBase64(text) {
        return Base64.toBase64(text);
    },
    md5(text) {
        return MD5(text);
    },
    /**
     * 前端数据过滤
     * @param {*} list 数组
     * @param {*} payload 关键字
     */
    gainSearch(list, payload) {
        let arr = [];
        list.filter(index => {
            // 过滤每一条数据对象
            if (index.name.indexOf(payload) >= 0) {
                // 每条数据对象的第一个值进行模糊搜索，多个可采用 ||
                return arr.push(index);
            }
        });
        return arr;
    },
    /**
     * 非模块内跳转的取parmas值方法
     */
    keyParamsFn(location, key) {
        var v = "";
        IX.iterbreak(location.split("&"), function (item) {
            if (item.indexOf(key + "=") !== 0) return "";
            v = item.substring(key.length + 1);
            throw v;
        });
        return v;
    },
    /**
     * 获取当前屏幕长宽
     */
    getDocumentInfo() {
        var w = document.documentElement.scrollWidth || document.body.scrollWidth;
        var h = document.documentElement.scrollHeight || document.body.scrollHeight;
        return {
            height: h,
            width: w
        };
    },
    /**
     * 将数字过滤
     */
    formatNumber(num) {
        var num = (num || 0).toString();
        var result = "";
        while (num.length > 3) {
            result = "," + num.slice(-3) + result;
            num = num.slice(0, num.length - 3);
        }
        if (num) {
            result = num + result;
        }
        return result;
    },
    dateFormat(dateTime, type) {
        try {
            // 判断时间为1970-01-01是为空
            if (dateTime == null || dateTime === '' || dateTime === 'undefined') {
                return dateTime;
            }
            let formatDate = new Date(Number(dateTime));
            let formatTime = '';
            let yy = formatDate.getFullYear();
            let mm = formatDate.getMonth() + 1;
            let dd = formatDate.getDate();
            let hh = formatDate.getHours();
            let min = formatDate.getMinutes();
            let ss = formatDate.getSeconds();
            if (mm >= 1 && mm <= 9) {
                mm = '0' + mm;
            }
            if (dd >= 0 && dd <= 9) {
                dd = '0' + dd;
            }
            if (hh >= 0 && hh <= 9) {
                hh = '0' + hh;
            }
            if (min >= 0 && min <= 9) {
                min = '0' + min;
            }
            if (ss >= 0 && ss <= 9) {
                ss = '0' + ss;
            }
            switch (type) {
                case 0:
                    formatTime = yy + mm + dd + hh + min + ss;
                    break;
                case 1:
                    formatTime = yy + '-' + mm + '-' + dd;
                    break;
                case 2:
                    formatTime = yy + "/" + mm + "/" + dd + " " + hh + ":" + min + ":" + ss;
                    break;
                case 3:
                    formatTime = yy + "年" + mm + "月" + dd + "日" + hh + "时" + min + "分" + ss + "秒";
                    break;
                case 4:
                    formatTime = yy + "_" + mm + "_" + dd + " " + hh + "_" + min + "_" + ss;
                    break;
                case 5:
                    formatTime = mm + "/" + dd;
                    break;
                case 6:
                    formatTime = hh + ":" + min + ":" + ss;;
                    break;
                default:
                    formatTime = yy + "-" + mm + "-" + dd + " " + hh + ":" + min + ":" + ss;
            }
            return formatTime;
        } catch (e) {
            return dateTime;
        }

    },
    // getBetweenDateStr(start, end) {
    //     console.log(start,end)
    //     var result = [];
    //     var beginDay = start.split("-");
    //     var endDay = end.split("-");
    //     var diffDay = new Date();
    //     var dateList = new Array;
    //     var i = 0;
    //     diffDay.setDate(beginDay[2]);
    //     diffDay.setMonth(beginDay[1] - 1);
    //     diffDay.setFullYear(beginDay[0]);
    //     result.push(start);
    //     while (i == 0) {
    //         var countDay = diffDay.getTime() + 24 * 60 * 60 * 1000;
    //         diffDay.setTime(countDay);
    //         dateList[2] = diffDay.getDate();
    //         dateList[1] = diffDay.getMonth() + 1;
    //         dateList[0] = diffDay.getFullYear();
    //         if (String(dateList[1]).length == 1) {
    //             dateList[1] = "0" + dateList[1]
    //         };
    //         if (String(dateList[2]).length == 1) {
    //             dateList[2] = "0" + dateList[2]
    //         };
    //         result.push(dateList[0] + "-" + dateList[1] + "-" + dateList[2]);
    //         if (dateList[0] == endDay[0] && dateList[1] == endDay[1] && dateList[2] == endDay[2]) {
    //             i = 1;
    //         }
    //     };
    //     console.log(result);
    //     return result;
    // },
    getYearAndMonthAndDay(start, end) {
        var date_all = [],
            i = 0;
        var startTime = getDate(start);
        var endTime = getDate(end);
        while ((endTime.getTime() - startTime.getTime()) >= 0) {
            var year = startTime.getFullYear();
            var month = (startTime.getMonth() + 1).toString().length == 1 ? "0" + (startTime.getMonth() + 1).toString() : (startTime.getMonth() + 1).toString();
            var day = startTime.getDate().toString().length == 1 ? "0" + startTime.getDate() : startTime.getDate();
            date_all[i] = year + "-" + month + "-" + day;
            startTime.setDate(startTime.getDate() + 1);
            i += 1;
        }
        return date_all;
    },
    // 将秒转换为几天几小时几分几秒
    secondFormat(second) {
        var dd, hh, mm, ss;
        second = typeof second === 'string' ? parseInt(second) : second;
        if (!second || second < 0) {
            return;
        }
        //天
        dd = second / (24 * 3600) | 0;
        second = Math.round(second) - dd * 24 * 3600;
        //小时
        hh = second / 3600 | 0;
        second = Math.round(second) - hh * 3600;
        //分
        mm = second / 60 | 0;
        //秒
        ss = Math.round(second) - mm * 60;
        if (Math.round(dd) < 10) {
            dd = dd > 0 ? '0' + dd : '';
        }
        if (Math.round(hh) < 10) {
            hh = '0' + hh;
        }
        if (Math.round(mm) < 10) {
            mm = '0' + mm;
        }
        if (Math.round(ss) < 10) {
            ss = '0' + ss;
        }
        return (dd ? dd + '天' : '') + (hh ? hh + '小时' : '') + (mm ? mm + '分' : '') + (ss ? ss + '秒' : '');
    },
    //0<=值<1024                        值                B/s
    //1024<=值<1024*1024                值/1024           KB/s
    //1024*1024<=值<1024*1024*1024     值/1024*1024      MB/s
    GETMSUNIT(item, k) {
        let number = parseFloat(item)
        switch (k) {
            case 'B/s':
                number = number
                break;
            case 'KB/s':
                number = number / 1024
                break;
            case 'MB/s':
                number = number / (1024 * 1024)
                break;
        }
        return number;
    },
    isUnit(item) {
        let number = parseFloat(item)
        var unit = '';
        if (0 <= number && number < 1024) {
            unit = 'B/s';
        } else
        if (1024 <= number && number < (1024 * 1024)) {
            unit = 'KB/s';
        } else
        if ((1024 * 1024) <= number && number < (1024 * 1024 * 1024)) {
            unit = 'MB/s';
        }
        return unit
    },
    /**
     * 浏览器全屏
     */
    fullscreen(flag) {
        /*判断是否全屏*/
        var isFullscreen =
            document.fullScreenElement || //W3C
            document.msFullscreenElement || //IE11
            document.mozFullScreenElement || //火狐
            document.webkitFullscreenElement || //谷歌
            false;
        if (flag) {
            var el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    }
});