//安装校验规则
export default function(NetPosaXUI) {
	NetPosaXUI.Validator.regist("number", {
		message: "请设置数值",
		check: function(val) {
			if (!val) {
				return true;
			}
			return Sunset.isNumber(val);
		}
	});
	NetPosaXUI.Validator.regist("integer", {
		message: "请设置整数",
		check: function(val) {
			if (!val) {
				return true;
			}
			return Sunset.isNumber(val) && String(val).indexOf(".") == -1;
		}
	});
	NetPosaXUI.Validator.regist("positiveInteger", {
		message: "请设置正整数",
		check: function(val) {
			if (!val) {
				return true;
			}
			return Sunset.isNumber(val) && String(val).indexOf(".") == -1 && +val > 0;
		}
	});
	NetPosaXUI.Validator.regist("gbId", {
		message: "国标id格式不正确",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^(\w|-){1,30}$/.test(val);
		}
	});
	NetPosaXUI.Validator.regist("ip", {
		message: "ip格式不正确",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))$/.test(
				val
			);
		}
	});
	NetPosaXUI.Validator.regist("port", {
		message: "端口1-65535",
		check: function(val) {
			if (!val) {
				return true;
			}
			if (Sunset.isNumber(val) && String(val).indexOf(".") == -1) {
				val = +val;
				return val > 0 && val <= 65535;
			}
			return false;
		}
	});
	NetPosaXUI.Validator.regist("ports", {
		message: "一个或多个端口号，逗号分隔",
		check: function(val) {
			if (!val) {
				return true;
			}
			var ps = String(val).split(",");
			for (var i = 0; i < ps.length; i++) {
				var v = ps[i];
				if (Sunset.isNumber(v) && String(val).indexOf(".") == -1) {
					v = +v;
					if (v > 0 && v <= 65535) {
						continue;
					}
				}
				return false;
			}
			return true;
		}
	});
	NetPosaXUI.Validator.regist("ipport", {
		message: "如192.168.100.100:3000",
		check: function(val) {
			if (!val) {
				return true;
			}
			var val = val + "";
			var ipport = val.split(":");
			if (ipport.length == 2) {
				return (
					/^((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))$/.test(
						ipport[0]
					) &&
					(Sunset.isNumber(ipport[1]) && +ipport[1] > 0 && +ipport[1] <= 65535)
				);
			}
			return false;
		}
	});
	NetPosaXUI.Validator.regist("lon", {
		message: "经度-180 至 180",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^(\-|\+)?(((\d|[1-9]\d|1[0-7]\d|0{1,3})\.\d{0,6})|(\d|[1-9]\d|1[0-7]\d|0{1,3})|180\.0{0,6}|180)$/.test(
				val
			);
		}
	});
	NetPosaXUI.Validator.regist("lat", {
		message: "纬度-90 至 90",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^(\-|\+)?([0-8]?\d{1}\.\d{0,6}|90\.0{0,6}|[0-8]?\d{1}|90)$/.test(val);
		}
	});
	NetPosaXUI.Validator.regist("phone", {
		message: "请输入正确电话",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(val);
		}
	});
	NetPosaXUI.Validator.regist("email", {
		message: "请输入正确邮箱",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(val);
		}
	});
	NetPosaXUI.Validator.regist("hourMinute", {
		message: "00:00 - 23:59",
		check: function(val) {
			if (!val) {
				return true;
			}
			return $regexp.isHourMinute(val);
		}
	});
	NetPosaXUI.Validator.regist("userName", {
		message: "用户名1-20个字符,可使用字母(字母区分大小写)、数字、下划线",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^[a-zA-Z0-9_-]{1,20}$/.test(val);
		}
	});
	NetPosaXUI.Validator.regist("password", {
		message: "密码6~20个字符,可使用字母、数字、字母(字母区分大小写),密码需包含字母和数字",
		check: function(val) {
			if (!val) {
				return true;
			}
			return /^(?=.*[0-9])(?=.*[a-zA-Z])(.{6,20})$/.test(val);
		}
	});
}
