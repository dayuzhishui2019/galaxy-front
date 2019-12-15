var REGS = {
	//精确车牌
	VehiclePlateNumber: /^([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF])|([DF]([A-HJ-NP-Z0-9])[0-9]{4})))|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1})$/,
	IP: /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$/,
	Port: /^([1-9]|[1-9]\d{1,3}|[1-6][0-5][0-5][0-3][0-5])$/,
	Phone: /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/,
	HourMinute: /^(([0-1]{1}[0-9]{1})|([2]{1}[0-3]{1})):([0-5]{1}[0-9]{1})$/,
	nomal: /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/
};

var tester = Object.keys(REGS).reduce((res, key) => {
	res[`is${key}`] = function (v) {
		return REGS[key].test(v);
	};
	return res;
}, {});

tester.RULES = REGS;

export default (window.$regexp = tester);