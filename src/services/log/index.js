//日志类型
const OPERATE_TYPES = {
    LOGIN: "1", //登录
    LOGOUT: "2", //退出
    VIEW: "3", //查看
    QUERY: "4", //查询
    CREATE: "5", //创建
    MODIFY: "6", //修改
    REMOVE: "7", //删除
    IMPORT: "8", //导入
    DOWNLOAD: "9", //下载
    CONTROL: "10", //控制
    ANALYSIS: "11" //分析
};

var $log = function(moduleName, funcName, operateType, description, extObj) {
    var userInfo = $business.getCurrentUser();
    return $http({
        url: "/gateway/logservice/nplog/logs/projects/logs/logstores/appLog",
        type: "POST",
        data: {
            content: JSON.stringify(
                Object.assign(
                    {
                        source: "tianhe",
                        module: moduleName,
                        function: funcName,
                        description: description,
                        userName: userInfo && userInfo.loginName,
                        orgName: userInfo && userInfo.userOrgName,
                        operateType: operateType
                    },
                    extObj || {}
                )
            )
        }
    });
};

$log.TYPES = OPERATE_TYPES;

export default (window.$log = $log);
