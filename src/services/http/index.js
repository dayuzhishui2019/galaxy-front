import axios from "axios";
import { resolve } from "url";
var time = 0;
export default window.$http = function(options) {
  var method = (options.type || options.method || "get").toLowerCase();
  var data = options.data;
  // if (data && (method == 'post' || method == 'put' || method == 'patch')) {
  //     data = JSON.stringify(data);
  // }v
  var config = {
    url: options.url,
    method: method,
    data: data
  };
  // config.url = config.url.replace('vehicle_service','pvd_vehicle_service'); //换车辆服务名
  //替换路径参数
  if (data) {
    config.url = config.url.replace(/{\w+}/g, function(v) {
      var key = v.substring(1, v.length - 1);
      var value = data[key];
      delete data[key];
      return value;
    });
  }
  var headers = {};
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  if (method == "get") {
    config.params = data;
  }
  if (options.formdata) {
    config.transformRequest = [
      function(data) {
        let ret = "";
        for (let it in data) {
          if (data[it] !== undefined && data[it] !== null) {
            ret +=
              encodeURIComponent(it) + "=" + encodeURIComponent(data[it]) + "&";
          }
        }
        return ret;
      }
    ];
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (options.multipart) {
    let fromData = new FormData();
    for (let i in data) {
      fromData.append(i, data[i]);
    }
    config.data = fromData;
    headers["Content-Type"] = "multipart/form-data";
  } else {
    headers["Content-Type"] = "application/json;charset=UTF-8";
  }
  config.headers = headers;
  if (options.responseType) {
    config.responseType = options.responseType;
  }
  return new Promise((resolve, reject) => {
    axios(config)
      .then(res => {
        var result = res.data;
        if (result.code) {
          if (result.code == 200) {
            resolve(result.data === void 0 ? result : result.data);
          } else if (result.code === 3000 || result.code === 30008) {
            $tip(result.message);
            $router.push("/");
          } else {
            var err = {};
            err.code = result.code;
            err.message =
              (result.data && result.data.message) ||
              result.message ||
              result.msg.detail;
            reject(err);
            if (err.message) {
              $tip(err.message, "error");
            }
          }
        } else {
          resolve(result);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
};
