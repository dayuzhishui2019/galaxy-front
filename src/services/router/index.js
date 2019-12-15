import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

var $router = (window.$router = new Router());

//模块跳转
function runModuleFunction(moduleName, funcName, args) {
	Vue.nextTick(() => {
		if (!$router.$frameset) {
			console.error(`frameset组件未挂载到$router中`);
		}
		var $moduleInstance = $router.$frameset.$children[0];
		if (!$moduleInstance) {
			console.error(`未找到模块组件`);
		}
		if (Sunset.isFunction($moduleInstance[funcName])) {
			$moduleInstance[funcName].apply($moduleInstance, args || []);
		} else {
			console.error(`模块【${moduleName}】未找到方法：${funcName}`);
		}
	});
}
$router.$jump = function(moduleName, funcName, ...args) {
	if ($router.currentRoute.name == moduleName) {
		runModuleFunction(moduleName, funcName, args);
	}
	$router.push(
		{
			name: moduleName
		},
		() => {
			runModuleFunction(moduleName, funcName, args);
		}
	);
};

$router.$open = function(moduleName, funcName, ...args){
	var key = Date.now();
	sessionStorage.setItem(key, JSON.stringify([moduleName, funcName, ...args]));
	window.open(`${location.protocol}//${location.host}/page.html?cacheKey=${key}`);
}

export default $router;
