// 声明全局的$tip $confirm

import "./notify.less";
//tip
window.$tip = window.notify = window.$notify = (function() {
	var $el = $('<div class="global-tip"><i class="xui_message-img iconfont"></i><span></span></div>');
	$el.appendTo("body");
	var $span = $("span", $el);
	var $icon = $("i", $el);
	var queue = [];
	var showing = null;
	var iconType = {
		warning: "iconjinggaotishi",
		warn: "iconjinggaotishi",
		info: "iconputongtishi",
		success: "iconchenggongtishi",
		error: "iconjinggaotishi",
		danger: "iconjinggaotishi"
	};
	var Message = function(...options) {
		var msgObj = {};
		if (options.length === 2) {
			msgObj.message = options[0];
			msgObj.type = options[1] || "info";
		} else if (options.length === 1 && Sunset.isObject(options[0])) {
			msgObj = options[0];
		} else if (Sunset.isString(options[0])) {
			msgObj = {
				type: "info",
				message: options[0]
			};
		}
		if(GlobalVue){
			GlobalVue.$message(msgObj)
			return 
		}
		return showMessage(msgObj);
	};
	function show(obj) {
		$icon.attr("class", `xui_message-img iconfont ${iconType[obj.type]} ${obj.type}`);
		$el.attr("class", `global-tip tip-${obj.type || "info"}`);
		$span.html(obj.msg);
		showing = obj;
		setTimeout(() => {
			$el.addClass("tip-show");
			setTimeout(() => {
				$el.removeClass("tip-show");
				showing = null;
				setTimeout(() => {
					if (queue.length) {
						show(queue.shift());
					}
				}, 300);
			}, 3000);
		}, 0);
	}
	function showMessage(options) {
		var msg = options.message,
			type = options.type;
		if (showing) {
			if (showing.type != type || showing.msg != msg) {
				queue.push({
					msg,
					type
				});
			}
		} else {
			show({
				msg,
				type
			});
		}
	}
	["success", "warning", "info", "error", "warn"].forEach(type => {
		Message[type] = options => {
			if (typeof options === "string") {
				options = {
					message: options
				};
			}
			options = options || {};
			options.type = type;
			return showMessage(options);
		};
	});
	return Message;
})();

//confirm
window.$confirm = (function() {
	var $el, $content, $ensure, $cancel, promise;
	function show(flag) {
		$el[flag?'show':'hide']();
		setTimeout(()=>{
			if (flag) {
				$el.addClass("visible");
			} else {
				$el.removeClass("visible");
			}
		},0)
	}
	function generateConfirmEl() {
		var wrap = document.createElement("div");
		wrap.className = "global-confirm";
		wrap.innerHTML = `
		<div class="global-confirm-box">
			<header>
				<span class="global-confirm-title">提示</span>
				<i class="xui-icon xui-icon-close"></i>
			</header>
			<div>
				<p class="global-confirm-content">确定要删除这些条目吗？</p>
			</div>
			<footer>
				<button class="xui-btn xui-btn-style xui-btn-normal xui-btn-primary global-confirm-ensure">确定</button>
				<button class="xui-btn xui-btn-style xui-btn-normal xui-btn-default global-confirm-cancel">取消</button>
			</footer>
		</div>
		<div class="global-confirm-mask"></div>
		`;
		document.body.appendChild(wrap);
		$el = $(wrap);
		$content = $(".global-confirm-content", wrap);
		$ensure = $(".global-confirm-ensure", wrap);
		$cancel = $(".global-confirm-cancel", wrap);
		$el.on("click", ev => {
			var $target = $(ev.target);
			if ($target.hasClass("xui-icon-close") || $target.hasClass("global-confirm-cancel")) {
				show(false);
				promise && promise.reject();
			} else if ($target.hasClass("global-confirm-ensure")) {
				show(false);
				promise && promise.resolve();
			}
		});
	}
	return function(msg) {
		if (!document.getElementsByClassName(".global-confirm")[0]) {
			generateConfirmEl();
		}
		$content.html(msg);
		show(true);
		return new Promise((resolve, reject) => {
			promise = {
				resolve,
				reject
			};
		});
	};
})();
