// import Sunset from "src/common/sunset";

import scrollbarwidth from "./scrollbarwidth";
import listenResize from "./listenResize.js";

/**
 * 高性能树
 *
 * author:sunset
 */

function FastTree(el, options, $vm) {
	this.$el = el;
	this.$vm = $vm;
	this.options = options || {};
	this.init();
}

function getElAttribute(el, attrName) {
	if (el) {
		var attrs = el.attributes || [];
		for (var i = 0, attr; (attr = attrs[i++]); ) {
			if (attr.name == attrName) {
				return attr.value;
			}
		}
	}
}
function closest(el, className) {
	if (!el) {
		return null;
	}
	while (true) {
		if (~(" " + el.className + " ").indexOf(" " + className + " ")) {
			return el;
		}
		if (el.parentNode == null) {
			return null;
		}
		el = el.parentNode;
	}
	return null;
}

function addClass(el, value) {
	var classes = (value || "").split(",");
	var j = 0;
	var cur = el.nodeType === 1 && (el.className ? " " + el.className + " " : " ");
	var clazz = null;
	while ((clazz = classes[j++])) {
		if (cur.indexOf(" " + clazz + " ") < 0) {
			cur += clazz + " ";
		}
	}
	var finalValue = cur.trim();
	if (el.className !== finalValue) {
		el.className = finalValue;
	}
}

function removeClass(el, value) {
	var classes = (value || "").split(",");
	var j = 0;
	var cur = el.nodeType === 1 && (el.className ? " " + el.className + " " : " ");
	var clazz = null;
	while ((clazz = classes[j++])) {
		while (cur.indexOf(" " + clazz + " ") >= 0) {
			cur = cur.replace(" " + clazz + " ", " ");
		}
	}
	var finalValue = cur.trim();
	if (el.className !== finalValue) {
		el.className = finalValue;
	}
}

FastTree.prototype = {
	constructor: FastTree,
	/**
	 * 初始化
	 */
	init(reset) {
		if (reset) {
			this.initStatus(true);
			this.initOptions();
			this.initNodes();
		} else {
			this.initStatus(true);
			this.initNodesWrap();
			this.initOptions();
			this.initEvent();
			this.initScroll();
			this.initWrapStatus();
			this.initNodes();
		}
	},
	/**
	 * 初始化状态
	 */
	initStatus(force) {
		//数据缓存
		if (force) {
			this.parentId_childrenIds = {};
			this.id_node = {};
			this.synchronousNodes = [];
			this.isSynchronousTree = false;
		}
		//状态
		this.nodes = null;
		this.selectIds = {};
		this.checkedIds = {};
		this.excludeCheckedIds = {};
		this.expandIds = {};
		this.expandingNode = {};
		this._loadPosterityCache = {}; //级联请求子孙节点缓存
		this._loadPosterityCacheFlag = {}; //级联请求子孙节点缓存
		this._searchResult = null;
		this._lastOperateNodeId = null;
		this.searchFilter = null;
	},
	/**
	 * 初始化dom结构
	 */
	initNodesWrap() {
		//container
		var $container = (this.$container = document.createElement("DIV"));
		$container.style.position = "relative";
		$container.className = "xui-fasttree-scroll";
		if (this.options.containerHeight) {
			$container.style.height = `${this.options.containerHeight}px`;
		}
		var barWidth = scrollbarwidth();
		$container.style.marginRight = `-${barWidth}px`;
		this.$el.appendChild($container);
		//wrap
		var $wrap = (this.$wrap = document.createElement("DIV"));
		$wrap.style.position = "relative";
		$wrap.className = "xui-fasttree-wrap";
		$wrap.style.height = `100%`;
		this.$container.appendChild($wrap);
		//nodes
		var $nodes = (this.$nodes = document.createElement("DIV"));
		$nodes.className = "xui-fasttree-nodes";
		this.$wrap.appendChild($nodes);
		$nodes.style.position = "absolute";
		//slider
		var $sliderBar = (this.$sliderBar = document.createElement("DIV"));
		$sliderBar.className = "xui-fasttree-scroll-bar vertical";
		this.$el.appendChild($sliderBar);
		var $slider = (this.$slider = document.createElement("DIV"));
		$slider.className = "xui-fasttree-scroll-bar-slider";
		this.$sliderBar.appendChild($slider);
	},
	/**
	 * 初始化配置
	 */
	initOptions() {
		var options = this.options;
		var keyMap = options.key || {};
		this.rootId = options.rootId || null;
		this.pIdKey = keyMap.parentId || "parentId";
		this.idKey = keyMap.id || "id";
		this.nameKey = keyMap.name || "name";
		this.titleKey = keyMap.title || "name";
		this.callbacks = options.callbacks || {};
		//焦点选中
		var focus = options.focus || {};
		this.enableFocus = focus.enable;
		this.focusOn = focus.focusOn || "click";
		this.multiFocus = Sunset.isFunction(focus.multiple) ? focus.multiple() : !!focus.multiple;
		//勾选
		var check = options.check || {};
		this.enableCheck = check.enable;
		this.isCheckMultiple = check.type == "multiple";
		this.isCheckCascdeChildren = check.cascade && check.cascade.indexOf("C") >= 0;
		this.isCheckCascdeParent = check.cascade && check.cascade.indexOf("P") >= 0;
	},
	/**
	 * 初始化滚动
	 */
	initScroll() {
		this.unlistenResize = listenResize(this.$wrap, () => {
			this._updateBar();
		});
		this._updateBar();

		//drag and click
		var self = this;
		function setVSliderTop(newTop) {
			self.$slider.style.top = `${newTop}px`;
			self.$container.scrollTop = ((newTop * 1.0) / self.scrollBarSpaceHeight) * self.scrollSpaceHeight;
		}
		var startTop = 0,
			startX = 0,
			startY = 0;
		this.$sliderBar.addEventListener("click", ev => {
			if (self.draging) {
				return;
			}
			if (ev.target == self.$sliderBar) {
				setVSliderTop(ev.offsetY - self.scrollSliderHeight * 0.5);
			}
		});
		function down(ev) {
			self.draging = true;
			startTop = parseInt(self.$slider.style.top);
			startX = ev.pageX;
			startY = ev.pageY;
			self.$el.style.userSelect = self.$el.style.webkitUserSelect = "none";
			addClass(self.$sliderBar, "hover");
		}
		function move(ev) {
			var offsetY = ev.pageY - startY;
			var newTop = startTop + offsetY;
			newTop = Math.max(newTop, 0);
			newTop = Math.min(self.scrollBarSpaceHeight, newTop);
			setVSliderTop(newTop);
		}
		function up(ev) {
			self.draging = false;
			document.body.style.userSelect = document.body.style.webkitUserSelect = "";
			removeClass(self.$sliderBar, "hover");
			setTimeout(() => {
				self.draging = false;
			});
		}
		function unmove(ev) {
			up(ev);
			document.removeEventListener("mousemove", move);
			document.removeEventListener("mouseup", unmove);
		}
		this.$slider.addEventListener("mousedown", ev => {
			down(ev);
			document.addEventListener("mousemove", move);
			document.addEventListener("mouseup", unmove);
		});
	},
	_updateBar() {
		var pane = this.$container,
			vslider = this.$slider,
			clientHeight = pane.clientHeight,
			scrollHeight = pane.scrollHeight,
			barHeight = this.$sliderBar.clientHeight;
		var sliderHeightPoint = (pane.clientHeight * 1.0) / pane.scrollHeight;
		var sliderHeight = barHeight * sliderHeightPoint;
		var diff = 0;
		if (sliderHeight < 50) {
			sliderHeight = 50;
		}
		this.scrollSliderHeight = sliderHeight;
		this.scrollSpaceHeight = scrollHeight - clientHeight;
		this.scrollBarSpaceHeight = barHeight - sliderHeight;
		this._scrollHandle(false);
		this.vscroll = this.scrollSpaceHeight > 0;
		if (clientHeight == scrollHeight) {
			removeClass(this.$sliderBar, "visible");
		} else {
			vslider.style.height = `${sliderHeight}px`;
			addClass(this.$sliderBar, "visible");
		}
	},
	_scrollHandle(flag) {
		if (this.draging) {
			return;
		}
		var pane = this.$container,
			clientHeight = pane.clientHeight,
			scrollHeight = pane.scrollHeight,
			scrollTop = pane.scrollTop;
		var move = (scrollTop * 1.0) / this.scrollSpaceHeight;
		this.$slider.style.top = `${move * this.scrollBarSpaceHeight}px`;
	},
	/**
	 * 初始化dom结构状态
	 */
	initWrapStatus() {
		var wrapNodeCount;
		this.containerHeight = this.options.containerHeight || this.$el.clientHeight;
		this.nodeHeight = this.nodeHeight || this._calculateNodeHeight();
		wrapNodeCount = Math.ceil(this.containerHeight / this.nodeHeight) + 1;
		if (wrapNodeCount == 0 || isNaN(wrapNodeCount)) {
			wrapNodeCount = 80;
		}
		if (wrapNodeCount != this.wrapNodeCount) {
			this._updateBar();
			this.wrapNodeCount = wrapNodeCount;
		}
		// console.log("containerHeight:" + this.containerHeight);
		// console.log("nodeHeight:" + this.nodeHeight);
	},
	/**
	 * 初始化事件
	 */
	initEvent() {
		var callbacks = this.callbacks;
		this.$container.addEventListener("scroll", () => {
			var start = Math.floor(this.$container.scrollTop / this.nodeHeight);
			this.render(start);
			this._scrollHandle();
		});
		var lastClickTarget,
			clickTimer = null;
		this.$wrap.addEventListener("click", ev => {
			var nodeId = getElAttribute(closest(ev.target, "xui-fasttree-node"), "data-nid");
			if (!nodeId) {
				return;
			}
			//toggle
			if (~ev.target.className.indexOf("xui-fasttree-toggle")) {
				this.toggle(nodeId);
				this._lastOperateNodeId = nodeId;
				return;
			}
			//check
			if (~ev.target.className.indexOf("xui-fasttree-checker")) {
				this.checkNode(nodeId);
				this._lastOperateNodeId = nodeId;
				return;
			}
			//operate
			if (~ev.target.className.indexOf("xui-fasttree-operate")) {
				this.operate(nodeId, getElAttribute(ev.target, "data-cmd"));
				this._lastOperateNodeId = nodeId;
				return;
			}
			//click
			var node = this.getNodeById(nodeId);
			//dbclick
			if (!lastClickTarget) {
				lastClickTarget = ev.target;
				clickTimer = setTimeout(() => {
					lastClickTarget = null;
					clickTimer = null;
					if (this._enableFocus(node) && this.focusOn === "click") {
						this.selectNode(nodeId, true);
						this._emit("selected-node", node);
					}
					if (this.options.isExpandOnClickNode) {
						this.toggle(nodeId);
					}
					this._emit("click-node", node);
				}, 350);
			} else if (lastClickTarget == ev.target && clickTimer) {
				clearTimeout(clickTimer);
				lastClickTarget = null;
				clickTimer = null;
				if (this._enableFocus(node) && this.focusOn === "dbclick") {
					this.selectNode(nodeId, true);
					this._emit("selected-node", node);
				}
				if (this.options.isExpandOnDbClickNode) {
					this.toggle(nodeId);
				}
				this._emit("dbclick-node", node);
			}
		});
		//drag
		var dragging = false;
		if (this.options.isEnableDragger) {
			var self = this;
			var dragNode, startX, startY;
			function dragmove(ev) {
				var length = Math.sqrt(Math.pow(ev.pageX - startX, 2) + Math.pow(ev.pageY - startY, 2));
				//计算拖拽距离
				if (length > 0) {
					self._emit("dragstart", dragNode);
					dragstart();
				}
			}
			function dragstart() {
				document.removeEventListener("mousemove", dragmove);
				document.removeEventListener("mouseup", dragstart);
				dragNode = null;
				dragging = false;
			}
			this.$wrap.addEventListener("mousedown", ev => {
				var nodeel = closest(ev.target, "xui-fasttree-node");
				var nodeId = getElAttribute(nodeel, "data-nid");
				if (nodeId) {
					dragging = true;
					dragNode = this.getNodeById(nodeId);
					startX = ev.pageX;
					startY = ev.pageY;
					document.addEventListener("mousemove", dragmove);
					document.addEventListener("mouseup", dragstart);
				}
			});
		}
		this.$container.addEventListener("mousedown", ev => {
			if (!dragging) {
				ev.preventDefault();
			}
		});
	},
	/**
	 * 通过id获取节点（从缓存中或搜索结果中）
	 * @param {String} id 节点id
	 */
	getNodeById(id) {
		if (this.id_node[id]) {
			return this.id_node[id];
		} else {
			return this._searchResult && this._searchResult[id];
		}
	},
	/**
	 * 触发事件
	 * @param {String} event 事件名稱
	 * @param {*} args 參數
	 */
	_emit(event, ...args) {
		//vue event
		this.$vm && this.$vm.$emit.apply(this.$vm, [event].concat(args));
		var ename = Sunset.Strings.toCamelCase(`on-${event}`);
		if (Sunset.isFunction(this.callbacks[ename])) {
			this.callbacks[ename].apply(null, args);
		}
	},
	/**
	 * 自定义操作
	 */
	operate(id, cmdIndex) {
		var tool = this.options.toolbar && this.options.toolbar[cmdIndex];
		if (tool && Sunset.isFunction(tool.operate)) {
			tool.operate(this.getNodeById(id), this.id_node);
			setTimeout(() => {
				this.render();
			}, 0);
		}
	},
	/**
	 * 计算渲染可视域的起始和终止位置
	 *
	 * @param {int} start 渲染起始位
	 *
	 */
	caculateRenderStart(start, nodes) {
		start = start === void 0 ? (this.lastStart === void 0 ? 0 : this.lastStart) : start;
		this.lastStart = start;
		var nodes = nodes || [];
		this.initWrapStatus();
		var end = Math.min(start + this.wrapNodeCount + 5, nodes.length); //+5个，延伸出视窗，防止闪烁
		if (end - start < this.wrapNodeCount) {
			start = Math.max(end - this.wrapNodeCount, 0);
		}
		start = Math.max(start, 0);
		// console.log(start);
		return {
			start,
			end
		};
	},
	/**
	 * 渲染
	 * @param {int} start 渲染起始位置
	 */
	render(start) {
		// console.time("all");
		// console.time("struct");
		var nodes = this.nodes;
		if (Sunset.isFunction(this.nodeFilter)) {
			nodes = nodes.filter(this.nodeFilter);
		}
		var range = this.caculateRenderStart(start, nodes),
			start = range.start,
			end = range.end;
		var html = [];
		var lastLevel = null;
		if (!nodes || nodes.length == 0) {
			return this._renderEmpty();
		}
		var ancestorIds = this._calculateCheckedAncestors();
		for (var i = start; i < end; i++) {
			lastLevel = this._calculateLevel(i, nodes, lastLevel);
			html.push(this._template(nodes[i], lastLevel, ancestorIds));
		}

		// console.timeEnd("struct");
		this.$nodes.style.top = start * this.nodeHeight + "px";
		this.$wrap.style.height = nodes.length * this.nodeHeight + "px";
		// console.time("innerHTML");
		// this.$nodes.innerHTML = html.join("");
		var $nodes = this.$nodes;
		delete this.$nodes;
		$nodes = this.replaceHtml($nodes, html.join(""));
		this.$nodes = $nodes;
		// console.timeEnd("innerHTML");
		//解决引刷新dom导致hover丢失的频闪
		delete this._lastOperateNodeId;
		clearTimeout(this._hoverFixedTimer);
		this._hoverFixedTimer = setTimeout(() => {
			var nodes = document.getElementsByClassName("xui-fasttree-node hover");
			if (nodes) {
				for (var i = 0, n; (n = nodes[i++]); ) {
					n.className = n.className.replace("hover", "");
				}
			}
		}, 0);
		// console.timeEnd("all");
	},
	/**
	 * 重置起始渲染
	 */
	_resetRender() {
		if (this.$container.scrollTop == 0) {
			this.render(0);
		} else {
			this.$container.scrollTop = "0px";
		}
	},
	/**
	 * 计算勾选的祖先节点
	 */
	_calculateCheckedAncestors() {
		var checkedIds = this.checkedIds,
			ancestorIds = {},
			pIdKey = this.pIdKey;

		var checkedArrayIds = Object.keys(checkedIds);
		for (var i = 0, l = checkedArrayIds.length; i < l; i++) {
			var node = this.getNodeById(checkedArrayIds[i]);
			if (node && !checkedIds[node[pIdKey]]) {
				ancestorIds[node[pIdKey]] = true;
			}
		}
		while (true) {
			var hasTrue = false;
			var checkedArrayIds = Object.keys(ancestorIds);
			for (var i = 0, l = checkedArrayIds.length; i < l; i++) {
				var node = this.getNodeById(checkedArrayIds[i]);
				if (node && !ancestorIds[node[pIdKey]]) {
					ancestorIds[node[pIdKey]] = true;
					hasTrue = true;
				}
			}
			if (!hasTrue) {
				break;
			}
		}
		return ancestorIds;
	},
	/**
	 * 高性能更新dom
	 * @param {dom} el 目标dom
	 * @param {String} html 内容
	 */
	replaceHtml(el, html) {
		var oldEl = typeof el === "string" ? document.getElementById(el) : el;
		var newEl = oldEl.cloneNode(false);
		newEl.innerHTML = html;
		oldEl.parentNode.replaceChild(newEl, oldEl);
		return newEl;
	},
	/**
	 * 构建单个节点的dom
	 * @param {*} node
	 * @param {*} level
	 */
	_template(node, level, ancestorIds) {
		var idKey = this.idKey;
		if (node && node._IS_EMPTY) {
			//空节点
			return `<div class="xui-fasttree-node-empty" style="padding-left:${level *
				(this.options.levelSpace || 30)}px;"></div>`;
		}
		var html = [],
			isParent = Sunset.isFunction(this.options.isParent) && this.options.isParent(node),
			id = node[idKey];
		html.push(
			`<div class="xui-fasttree-node node-${id} ${this.selectIds[id] ? "selected" : ""} ${
				!isParent && this.tool ? "add-icon" : ""
			} ${this._lastOperateNodeId == id ? "hover" : ""}"  style="padding-left:${level *
				(this.options.levelSpace || 30)}px;" data-nid="${id}" title="${node[this.titleKey]}">`
		);

		html.push(`<div class="xui-fasttree-widgets">`);
		if (isParent) {
			html.push(`<div class="xui-fasttree-toggle ${this.expandIds[id] ? "expand" : ""}"></div>`);
		} else {
			html.push(`<div class="xui-fasttree-toggle-empty"></div>`);
		}
		//check
		if (this._enableCheck(node)) {
			var checkStatus = this._calculateCheckedStatus(node, ancestorIds);
			if (this.isCheckMultiple) {
				html.push(`<div class="xui-fasttree-checker multiple ${checkStatus}"></div>`);
			} else {
				html.push(`<div class="xui-fasttree-checker single ${checkStatus}"></div>`);
			}
		}
		html.push(`</div>`);
		// 节点内容
		html.push(`<div class="xui-fasttree-nodewrap" ${this.options.isEnableDragger ? 'draggable="true"' : ""}>`);
		//toolbar
		var toolbar = this.options.toolbar;
		var tips = this.options.tips;
		if ((Sunset.isArray(toolbar) && toolbar.length > 0) || (Sunset.isArray(tips) && tips.length > 0)) {
			html.push(`<div class="xui-fasttree-nodetoolbar">`);
			tips &&
				tips.forEach((item, index) => {
					if ((Sunset.isFunction(item.visible) && !item.visible(node)) || !Sunset.isFunction(item.content)) {
						// console.log("hidden");
						return;
					}
					html.push(
						`<span class="xui-fasttree-tip" class="${item.className || ""}">${item.content(node)}</span>`
					);
				});
			65;

			toolbar &&
				toolbar.forEach((item, index) => {
					if (Sunset.isFunction(item.visible) && !item.visible(node)) {
						return;
					}
					html.push(
						`<span class="xui-fasttree-operate ${item.icon}" class="${item.className || ""}" title="${
							item.title
						}" style="${item.style}"  data-nid="${node[idKey]}" data-cmd="${index}"></span>`
					);
				});
			html.push("</div>");
		}
		html.push(`<div class="xui-fasttree-nodecontent">`);
		if (Sunset.isFunction(this.options.template)) {
			html.push(`${this.options.template(node)}`);
		} else {
			//icon
			var icon = this.options.icon;
			if (icon) {
				html.push(Sunset.isFunction(icon) ? icon(node) : icon);
			}
			//label
			html.push(
				`<span class="xui-fasttree-nodelabel" title="${node[this.nameKey]}">${node[this.nameKey]}</span>`
			);
		}
		html.push("</div></div></div>");

		return html.join("");
	},
	/**
	 * 计算节点在树中的层级
	 * @param {int} index 节点位置
	 * @param {list} nodes 节点数组
	 */
	_calculateLevel(index, nodes, lastLevel) {
		var idKey = this.idKey;
		var pIdKey = this.pIdKey;
		var level = 0;
		var parentId = nodes[index][pIdKey];
		if (nodes[index]._fromSearch) {
			return 0;
		}
		if (lastLevel != null && parentId === nodes[index - 1][pIdKey]) {
			return lastLevel;
		}
		if (!nodes[0]._fromSearch) {
			while (true) {
				if (parentId == this.rootId) {
					break;
				}
				if (index == 0) {
					break;
				}
				var parentNode = this.id_node[parentId];
				if (!parentNode) {
					break;
				}
				parentId = parentNode[pIdKey];
				level++;
			}
		} else {
			while (true) {
				var node = nodes[index];
				if (node[idKey] == parentId) {
					parentId = node[pIdKey];
					level++;
				}
				if (parentId == this.rootId) {
					break;
				}
				if (node._fromSearch) {
					break;
				}
				if (index == 0) {
					break;
				}
				index--;
			}
		}
		return level;
	},
	/**
	 * 计算是否为弱选状态
	 */
	_calculateCheckedStatus(node, ancestorIds) {
		var idKey = this.idKey;
		var pIdKey = this.pIdKey;
		var checkedIds = this.checkedIds;
		var excludeCheckedIds = this.excludeCheckedIds;
		var id = node[idKey];
		var parentId = node[pIdKey];

		if (checkedIds[id]) {
			//强选
			if (this.options.isStrongCheckedMode || !this.isCheckMultiple) {
				return "checked";
			} else {
				return this._isChildrenAllChecked(id) ? "checked" : "half-check";
			}
		}
		if (excludeCheckedIds[id]) {
			//非选
			return "checked exclude";
		}

		if (id === "__CHECK_ALL__") {
			return this.nodes.filter(n => n[idKey] != "__CHECK_ALL__" && !this.checkedIds[n[idKey]]).length
				? ""
				: "checked";
		}

		if (this.options.isStrongCheckedMode) {
			//弱选
			while (true) {
				if (checkedIds[parentId]) {
					return "checked weak";
				}
				if (excludeCheckedIds[parentId]) {
					return "checked exclude weak";
				}
				parentId = this.id_node[parentId] && this.id_node[parentId][pIdKey];
				if (parentId == this.rootId || !parentId) {
					break;
				}
			}
		}
		if (ancestorIds[id]) {
			return this._isChildrenAllChecked(id) ? "checked" : "half-check";
		}
		return "";
	},
	_isChildrenAllChecked(id) {
		var checkedIds = this.checkedIds;
		var childrenIds = this.parentId_childrenIds[id];
		if (childrenIds && childrenIds.length > 0) {
			for (var i = 0, l = childrenIds.length; i < l; i++) {
				var childId = childrenIds[i];
				if (this._isVirtualNode(childId)) {
					continue;
				}
				if (this.parentId_childrenIds[childId] && !this._isChildrenAllChecked(childId)) {
					return false;
				} else if (!checkedIds[childId]) {
					return false;
				}
			}
		}
		return true;
	},
	_isVirtualNode(id) {
		var node = this.id_node[id];
		return node && node.__FASTREENODE;
	},
	/**
	 * 计算是否为半选状态
	 * @param {*} id 节点id
	 */
	_calculateHalfChecked(id) {
		var checkedIds = this.checkedIds;
		if (checkedIds[id]) {
			return false;
		}
		var childrenIds = this.parentId_childrenIds[id];
		if (!childrenIds || childrenIds.length == 0) {
			return false;
		}
		for (var i = 0, l = childrenIds.length; i < l; i++) {
			if (!checkedIds[childrenIds[i]]) {
				return true;
			}
		}
		return false;
	},
	/**
	 * 渲染空
	 */
	_renderEmpty() {
		var empty = this.options.empty,
			html;
		if (Sunset.isFunction(empty)) {
			html = empty();
		} else {
			html = '<div class="xui-fasttree-empty"></div>';
		}
		this.$nodes.innerHTML = html;
		this.$nodes.style.top = "0px";
	},
	/**
	 * 计算节点高度
	 */
	_calculateNodeHeight() {
		if (this.options.nodeHeight) {
			return this.options.nodeHeight;
		}
		var tester = {};
		tester[this.nameKey] = "测试节点高度";
		var div = document.createElement("DIV");
		div.innerHTML = this._template(tester, 0, {});
		div.style.position = "absolute";
		div.style.top = "-9999px";
		div.style.left = "0px";
		this.$nodes.appendChild(div);
		var nodeHeight = div.clientHeight;
		div.remove();
		// console.log("节点高度：" + nodeHeight);
		return nodeHeight;
	},
	/**
	 * 初始化节点
	 */
	initNodes() {
		var datasource = this.options.datasource;
		var initNodes = this.options.nodes;
		Promise.resolve()
			.then(() => {
				if (initNodes) {
					return Promise.resolve(Sunset.isFunction(initNodes) ? initNodes() : initNodes).then(res => {
						if (Sunset.isArray(res)) {
							return this.setNodes(res);
						}
					});
				} else if (Sunset.isFunction(datasource)) {
					return this.loadChildrenNodes(null);
				} else {
					return [];
				}
			})
			.then(res => {
				var roots = this.parentId_childrenIds[this.rootId];
				if (this.options.isAutoExpandRoot) {
					if (roots && roots.length) {
						this.expandNode(roots[0]);
					}
				}
				this._emit("init", this.getNodeById(roots && roots[0]));
			});
	},
	/**
	 * 加载子节点
	 * @param {*} parentId
	 */
	loadChildrenNodes(parentNode, force) {
		var parentNodeId = (parentNode && parentNode[this.idKey]) || this.rootId,
			childrenIds = this.parentId_childrenIds[parentNodeId];
		if (!childrenIds || force) {
			return Promise.resolve()
				.then(() => {
					if (this.options.datasource) {
						return this.options.datasource(parentNode);
					} else {
						return [];
					}
				})
				.then(children => {
					delete this.parentId_childrenIds[parentNodeId];
					if (parentNode && children.length == 0) {
						//空节点
						var emptyNode = {};
						emptyNode[this.pIdKey] = parentNode[this.idKey];
						emptyNode[this.idKey] = Date.now();
						emptyNode._IS_EMPTY = true;
						emptyNode.__FASTREENODE = true;
						children = [emptyNode];
					}
					//添加新节点
					this.addNodes(children, true);
					return children;
				});
		} else {
			return Promise.resolve(childrenIds.map(id => this.getNodeById(id)));
		}
	},
	/**
	 * 设置静态节点数据
	 * @param {*} nodes
	 */
	setNodes(nodes) {
		this.initStatus(true);
		this.isSynchronousTree = !!this.options.nodes; //是否同步树
		this.synchronousNodes = nodes;
		// console.time("addNodes")
		this.addNodes(nodes, true);
		// console.timeEnd("addNodes")
	},
	/**
	 * 添加节点数据
	 * @param {*} nodes
	 */
	addNodes(nodes, fillEmpty) {
		if (Sunset.isArray(nodes) && nodes.length > 0) {
			console.time("generate");
			this.generateVirtualTree(nodes, fillEmpty);
			console.timeEnd("generate");
			this.nodes =
				this.nodes ||
				((this.parentId_childrenIds[this.rootId] &&
					this.parentId_childrenIds[this.rootId].map(id => this.id_node[id])) ||
					[]);
			console.time("render");
			this.render();
			console.timeEnd("render");
		}
	},
	removeNode(id, slient) {
		Object.keys(this.parentId_childrenIds).forEach(pcKey => {
			this._removeFromArray(this.parentId_childrenIds[pcKey], id);
		});
		delete this.id_node[id];
		this._removeFromArray(this.nodes, id, true);
		delete this.selectIds[id];
		delete this.checkedIds[id];
		delete this.expandIds[id];
		if (this.parentId_childrenIds[id]) {
			this.parentId_childrenIds[id].forEach(cid => {
				this.removeNode(cid, true);
			});
		}
		slient || this.render();
	},
	_removeFromArray(list, id, isObject) {
		if (!list) {
			return;
		}
		var index;
		if (isObject) {
			index = Sunset.Arrays.findIndex(list, item => {
				return item[this.idKey] == id;
			});
		} else {
			index = list.indexOf(id);
		}
		if (index >= 0) {
			list.splice(index, 1);
		}
	},
	/**
	 * 构建节点虚拟树结构
	 * @param {*} nodes
	 */
	generateVirtualTree(nodes, fillEmpty) {
		var pIdKey = this.pIdKey;
		var idKey = this.idKey;
		var p_c = this.parentId_childrenIds;
		var i_n = this.id_node;
		// console.time("calculate");
		var pid_cidMap = {};
		for (var i = 0, item; (item = nodes[i++]); ) {
			var id = item[idKey];
			var pId = item[pIdKey];
			i_n[id] = item;
			var cids = (p_c[pId] = p_c[pId] || []);
			if (fillEmpty) {
				cids.push(id);
			} else {
				if (!pid_cidMap[pId]) {
					var cmap = {};
					for (var i = 0, l = cids.length; i < l; i++) {
						cmap[cids[i]] = true;
					}
					pid_cidMap[pId] = cmap;
				}
				if (!pid_cidMap[pId][id]) {
					cids.push(id);
					pid_cidMap[pId][id] = true;
				}
			}
		}
		// console.timeEnd("calculate");
	},
	_replaceOrRemoveNodeFromArray(list, node, filter) {
		var index = Sunset.Arrays.findIndex(list, filter);
		if (index >= 0) {
			if (node === null) {
				list.splice(index, 1);
			} else {
				list[index] = node;
			}
		}
	},
	/**
	 * 展开/收起
	 * @param {*} id
	 */
	toggle(id) {
		if (!this.expandIds[id]) {
			this.expandNode(id);
		} else {
			this.closeNode(id);
		}
	},
	/**
	 * 展开节点
	 * @param {*} id
	 */
	expandNode(id) {
		if (this.expandingNode[id]) {
			return;
		}
		this.expandingNode[id] = true;
		var node = this.getNodeById(id);
		if ((node && Sunset.isFunction(this.options.isParent) && !this.options.isParent(node)) || this.expandIds[id]) {
			delete this.expandingNode[id];
			return;
		}

		return Promise.resolve()
			.then(() => {
				if (!Sunset.isArray(this.parentId_childrenIds[id])) {
					var els = document.getElementsByClassName(`xui-fasttree-node node-${id}`);
					var el = els && els[0];
					if (el) {
						addClass(el, "loading");
					}
					return this.loadChildrenNodes(node).then(res => {
						el && removeClass(el, "loading");
						return res;
					});
				}
			})
			.then(() => {
				//关闭兄弟节点
				if (this.options.isExpandSingleInLevel) {
					var brotherIds = this.parentId_childrenIds[node[this.pIdKey]];
					brotherIds && brotherIds.forEach(brotherId => this.closeNode(brotherId, true));
					this.render();
				}
				var idKey = this.idKey;
				var childrenIds = this.parentId_childrenIds[id];
				if (childrenIds && childrenIds.length) {
					var nodes = this.nodes;
					var index = Sunset.Arrays.findIndex(nodes, n => n[idKey] == id);
					var before = nodes.slice(0, index + 1);
					var after = nodes.slice(index + 1, nodes.length);
					nodes = before.concat(childrenIds.map(cid => this.id_node[cid])).concat(after);
					//级联展开原展开的子节点
					var self = this;
					function expand(childrenIds) {
						childrenIds &&
							childrenIds.forEach(id => {
								if (self.expandIds[id]) {
									var childIds = self.parentId_childrenIds[id];
									if (childIds && childIds.length) {
										var index = Sunset.Arrays.findIndex(nodes, n => n[idKey] == id);
										var before = nodes.slice(0, index + 1);
										var after = nodes.slice(index + 1, nodes.length);
										nodes = before.concat(childIds.map(cid => self.id_node[cid])).concat(after);
										expand(childIds);
									}
								}
							});
					}
					expand(childrenIds);
					this.nodes = nodes;
				}
				this.expandIds[id] = true;
				delete this.expandingNode[id];
				this.render();
			});
	},
	/**
	 * 级联展开层级节点
	 */
	expandCascadeNodes(ancestors, focusId) {
		//并行查询
		Promise.all(
			ancestors.map(node => {
				this.id_node[node[this.idKey]] = node;
				return this.loadChildrenNodes(node);
			})
		)
			.then(() => {
				//祖先排序
				var l = ancestors.length,
					sortAncestors = [];
				var pid_node = ancestors.reduce((res, item) => {
					if (item[this.pIdKey] == null) {
						item[this.pIdKey] = this.rootId;
					}
					res[item[this.pIdKey]] = item;
					return res;
				}, {});
				var pId = this.rootId;
				while (true) {
					var node = pid_node[pId];
					if (!node) {
						break;
					}
					sortAncestors.push(node);
					pId = node[this.idKey];
				}
				//顺序展开
				return sortAncestors.reduce((promise, node) => {
					return promise.then(() => {
						return this.expandNode(node[this.idKey]);
					});
				}, Promise.resolve());
			})
			.then(() => {
				this.focusNode(focusId, true);
			});
	},
	focusNode(focusId, scroll) {
		this.selectIds = {};
		this.selectIds[focusId] = true;
		if (scroll) {
			if (this.$container.scrollHeight == 0) {
				return;
			}
			var range = this.caculateRenderStart(
				Sunset.Arrays.findIndex(this.nodes, item => item[this.idKey] == focusId),
				this.nodes
			);
			if (this.$container.scrollHeight > this.$container.clientHeight) {
				this.$container.scrollTop = range.start * this.nodeHeight;
			} else {
				this.render(range.start);
			}
		} else {
			this.render();
		}
	},
	/**
	 * 收起节点
	 * @param {*} id
	 */
	closeNode(id, slient) {
		if (this.expandingNode[id]) {
			return;
		}
		if (!this.expandIds[id]) {
			return;
		}
		var removeParentIds = {};
		removeParentIds[id] = true;
		var node = this.getNodeById(id);
		var nodes = this.nodes;
		var index = Sunset.Arrays.findIndex(nodes, n => n.id == id);
		if (index >= 0) {
			var result = nodes.slice(0, index + 1);
			index++;
			while (index < nodes.length) {
				var n = nodes[index];
				var nId = n[this.idKey];
				var parentId = n[this.pIdKey];
				if (!removeParentIds[parentId] || n._fromSearch) {
					break;
				}
				removeParentIds[nId] = true;
				index++;
			}
			result = result.concat(nodes.slice(index));
			delete this.expandIds[id];
			this.nodes = result;
			slient || this.render();
		}
	},
	/**
	 * 选中节点
	 * @param {*} id 节点id
	 * @param {*} flag 选中状态
	 */
	selectNode(id, flag) {
		if (flag === false) {
			delete this.selectIds[id];
		} else {
			if (this.multiFocus) {
				if (flag === void 0 && this.selectIds[id]) {
					delete this.selectIds[id];
				} else {
					this.selectIds[id] = true;
				}
			} else {
				this.selectIds = {};
				this.selectIds[id] = true;
			}
		}
		var childNodes = this.$nodes.childNodes;
		for (var i = 0, n; (n = childNodes[i++]); ) {
			if (!this.selectIds[getElAttribute(n, "data-nid")]) {
				removeClass(n, "selected");
			} else {
				addClass(n, "selected");
			}
		}
	},
	clearSelected() {
		this.selectIds = {};
		this.render();
	},
	/**
	 * 是否可选中
	 */
	_enableFocus(node) {
		if (this.enableFocus === true) {
			return true;
		} else if (Sunset.isFunction(this.enableFocus)) {
			return this.enableFocus(node);
		} else {
			return false;
		}
	},
	/**
	 * 勾选节点
	 * @param {*} id
	 */
	checkNode(id, isToChecked, slient) {
		if (id === "__CHECK_ALL__") {
			isToChecked = false;
			var ids = this.nodes
				.filter(item => item[this.idKey] != "__CHECK_ALL__")
				.map(item => {
					if (!this.checkedIds[item[this.idKey]]) {
						isToChecked = true;
					}
					return item[this.idKey];
				});
			if (isToChecked) {
				this.checkNodes(ids);
			} else {
				this.clearChecked();
			}
			return;
		}
		Promise.resolve()
			.then(() => {
				var isChecked = this.checkedIds[id],
					reRender = false;
				if (this.isCheckMultiple) {
					//多选
					if (isToChecked !== void 0) {
						delete this.excludeCheckedIds[id];
						if (isToChecked) {
							this.checkedIds[id] = true;
						} else {
							delete this.checkedIds[id];
						}
					} else {
						isToChecked = !isChecked;
						if (this.options.isExcludeCheckedMode) {
							//强弱排除模式
							if (this.checkedIds[id]) {
								delete this.checkedIds[id];
								this.excludeCheckedIds[id] = true;
							} else if (this.excludeCheckedIds[id]) {
								delete this.checkedIds[id];
								delete this.excludeCheckedIds[id];
							} else {
								this.checkedIds[id] = true;
								delete this.excludeCheckedIds[id];
							}
						} else {
							//普通模式
							if (isChecked) {
								delete this.checkedIds[id];
							} else {
								this.checkedIds[id] = true;
							}
						}
					}
				} else {
					//单选
					isToChecked = isToChecked !== false;
					if (isToChecked) {
						this.checkedIds = {};
						this.checkedIds[id] = true;
					} else {
						this.checkedIds = {};
					}
				}
			})
			.then(res => {
				if (!this.isCheckMultiple) {
					this.render();
					return;
				}
				if (this.isCheckCascdeChildren) {
					///////////////////////////////////////////// 级联子节点
					//勾选已加载的子节点
					var self = this;
					function cascadeCheckChild(childrenIds) {
						if (childrenIds) {
							childrenIds.forEach(cid => {
								if (isToChecked) {
									if (!self.searchFilter || self.searchFilter(self.id_node[cid])) {
										self.checkedIds[cid] = true;
									}
								} else {
									delete self.checkedIds[cid];
								}
								cascadeCheckChild(self.parentId_childrenIds[cid]);
							});
						}
					}
					cascadeCheckChild(this.parentId_childrenIds[id]);
					///////////////////////////////////////////// 级联父节点
					function cascadeCheckParent(cid) {
						if (!isToChecked) {
							var cnode = self.id_node[cid];
							if (cnode) {
								var pid = cnode[self.pIdKey];
								var cids = self.parentId_childrenIds[pid];
								if (!cids) {
									return;
								}
								// for (var i = 0, l = cids.length; i < l; i++) {
								// 	if (self.checkedIds[cids[i]]) {
								// 		return;
								// 	}
								// }
								delete self.checkedIds[pid];
								cascadeCheckParent(pid);
							}
						}
					}
					cascadeCheckParent(id);
					//渲染
					this.render();
					//请求勾选未加载的子节点
					if (Sunset.isFunction(this.options.isParent) && this.options.isParent(this.getNodeById(id))) {
						return this._loadPosterity(id).then(posterities => {
							posterities &&
								posterities.forEach(n => {
									if (isToChecked) {
										this.checkedIds[n[this.idKey]] = true;
									} else {
										delete this.checkedIds[n[this.idKey]];
									}
								});
						});
					}
				} else {
					//渲染
					this.render();
				}
			})
			.then(() => {
				//渲染
				this.render();
				if (!slient) {
					this._emitCheckedNodes();
				}
			});
	},
	checkNodes(ids, excludeIds) {
		var checkedIds = {};
		var excludeCheckedIds = {};
		var unloadCheckedIds = {};
		var id_node = this.id_node;
		ids &&
			ids.forEach(id => {
				checkedIds[id] = true;
				if (!id_node[id]) {
					unloadCheckedIds[id] = true;
				}
			});
		excludeIds &&
			excludeIds.forEach(id => {
				excludeCheckedIds[id] = true;
				if (!id_node[id]) {
					unloadCheckedIds[id] = true;
				}
			});
		unloadCheckedIds = Object.keys(unloadCheckedIds);
		this.checkedIds = checkedIds;
		this.excludeCheckedIds = excludeCheckedIds;
		this.render();
		if (unloadCheckedIds.length) {
			var idKey = this.idKey;
			return Promise.resolve()
				.then(() => {
					if (unloadCheckedIds.length < 100 && Sunset.isFunction(this.options.loadAncestors)) {
						return this.options.loadAncestors(unloadCheckedIds.join(",")).then(res => {
							if (res && res.length) {
								if (res.length <= 10) {
									return Promise.all(
										res.map(node => {
											id_node[node[idKey]] = node;
											return this.loadChildrenNodes(node);
										})
									);
								} else {
									return this.loadChildrenNodes().then(res => {
										var rootIds = this.parentId_childrenIds[this.rootId];
										if (rootIds && rootIds.length) {
											return this._loadPosterity(rootIds.join(","));
										}
									});
								}
							}
						});
					} else {
						return this.loadChildrenNodes().then(res => {
							var rootIds = this.parentId_childrenIds[this.rootId];
							if (rootIds && rootIds.length) {
								return this._loadPosterity(rootIds.join(","));
							}
						});
					}
				})
				.then(res => {
					this.render();
					this._emitCheckedNodes();
				});
		} else {
			this._emitCheckedNodes();
		}
	},
	clearChecked() {
		this.checkedIds = {};
		this.render();
		this._emitCheckedNodes();
	},
	_emitCheckedNodes() {
		var checkedIds = this.checkedIds;
		var checkedNodes = Object.keys(checkedIds)
			.map(id => this.getNodeById(id))
			.filter(item => {
				return item && !item.__FASTREENODE;
			});
		// console.log("fast-tree-check : " + checkedNodes.length);
		this._emit(
			"checked",
			checkedNodes,
			Object.keys(this.excludeCheckedIds)
				.map(id => this.getNodeById(id))
				.filter(item => {
					return item && !item.__FASTREENODE;
				})
		);
	},
	/**
	 * 级联获取子孙节点
	 */
	_loadPosterity(id) {
		return Promise.resolve().then(() => {
			if (this._loadPosterityCacheFlag[id]) {
				return this._loadPosterityCache[id];
			} else {
				if (Sunset.isFunction(this.options.loadPosterity)) {
					return this.options.loadPosterity(id).then(res => {
						if (res) {
							this.addNodes(res);
						}
						this._loadPosterityCacheFlag[id] = true;
						this._loadPosterityCache[id] = res;
						return res;
					});
				}
			}
		});
	},
	/**
	 * 是否可勾选
	 * @param {*} node
	 */
	_enableCheck(node) {
		if (Sunset.isFunction(this.enableCheck)) {
			return this.enableCheck(node, this.id_node, this.parentId_childrenIds);
		} else if (this.enableCheck) {
			return true;
		} else {
			return false;
		}
	},
	/**
	 * 暂存状态
	 */
	temporaryStatus() {
		//状态
		this._nodes = this._nodes || this.nodes;
		this._selectIds = this._selectIds || this.selectIds;
		this._checkedIds = this._checkedIds || this.checkedIds;
		this._expandIds = this._expandIds || this.expandIds;
		this.nodes = [];
		this.selectIds = {};
		this.expandIds = {};
		this._searchResult = {};
		this.isTemporaryStatus = true;
	},
	/**
	 * 恢复状态
	 */
	recoveryStatus() {
		if (!this.isTemporaryStatus) {
			return;
		}
		this.nodes = this._nodes;
		this.selectIds = this._selectIds;
		this.expandIds = this._expandIds;
		delete this._searchResult;
		delete this._nodes;
		delete this._selectIds;
		delete this._expandIds;
		this.isTemporaryStatus = false;
	},
	/**
	 * 根据关键字搜索
	 * @param val - 搜索关键字
	 * @param force - 是否强制搜索
	 */
	search: Sunset.debounce(function(keyword, force) {
		keyword = keyword || "";
		if (this.isSynchronousTree) {
			//同步树展开
			this.expandBySearchKeyword(keyword);
		} else {
			//异步树搜索
			if (Sunset.isFunction(this.options.search)) {
				if (force || keyword) {
					this.temporaryStatus();
					this.options.search(keyword).then(res => {
						this.nodes = (res || []).map(n => {
							if (!this.id_node[n[this.idKey]]) {
								this.id_node[n[this.idKey]] = n;
							}
							var searchNode = Object.assign({}, n);
							searchNode._fromSearch = true; //标记源于搜索
							this._searchResult[searchNode[this.idKey]] = searchNode;
							return searchNode;
						});
						if (this.isCheckMultiple && res.length) {
							var checkAll = {};
							checkAll[this.idKey] = "__CHECK_ALL__";
							checkAll[this.pIdKey] = this.rootId;
							checkAll[this.nameKey] = "全部";
							checkAll.__FASTREENODE = true;
							checkAll.className = "xui-fasttreenode-checkall";
							this.nodes.unshift(checkAll);
						}
						this._resetRender();
					});
					return;
				}
			}
			this.recoveryStatus();
			this._resetRender();
		}
	}, 400),
	/**
	 * 根据搜索结果展开树
	 */
	expandBySearchKeyword(keyword) {
		var rootId = this.rootId;
		var id_node = this.id_node;
		var idKey = this.idKey;
		var nameKey = this.nameKey;
		var pIdKey = this.pIdKey;
		var allNodes = this.synchronousNodes;
		this.expandIds = {};
		var self = this;
		if (keyword.trim() != "") {
			var map = {};
			var parentId_childs = {};
			var parentId_childrenIds = {};
			//匹配节点
			var filterFunc =
				this.options.searchFilter ||
				function(node, keyword) {
					return node[nameKey].indexOf(keyword) >= 0;
				};
			this.searchFilter = function(node) {
				return filterFunc(node, keyword);
			};
			var searchNodes = allNodes.filter(node => {
				if (filterFunc(node, keyword)) {
					map[node[idKey]] = true;
					parentId_childs[node[pIdKey]] = parentId_childs[node[pIdKey]] || [];
					parentId_childs[node[pIdKey]].push(node);
					parentId_childrenIds[node[pIdKey]] = parentId_childrenIds[node[pIdKey]] || [];
					parentId_childrenIds[node[pIdKey]].push(node[idKey]);
					return true;
				} else {
					return false;
				}
			});
			//回溯根
			var parents = [];
			function getParents(parentId, res) {
				res = res || [];
				if (parentId == rootId) {
					return res;
				} else {
					self.expandIds[parentId] = true;
					var p = id_node[parentId];
					if (!map[parentId]) {
						map[parentId] = true;
						parentId_childs[p[pIdKey]] = parentId_childs[p[pIdKey]] || [];
						parentId_childs[p[pIdKey]].push(p);
						parentId_childrenIds[p[pIdKey]] = parentId_childrenIds[p[pIdKey]] || [];
						parentId_childrenIds[p[pIdKey]].push(p[idKey]);
						parents.push(p);
					}
					return getParents(p[pIdKey], res);
				}
			}
			for (var i = 0, l = searchNodes.length; i < l; i++) {
				var cn = searchNodes[i];
				var ps = getParents(cn[pIdKey]);
			}
			searchNodes = searchNodes.concat(parents);
			//排序
			var pc = parentId_childs;
			var result = [];
			function pushChildren(id) {
				var cs = parentId_childs[id];
				cs &&
					cs.forEach(n => {
						result.push(n);
						if (parentId_childs[n[idKey]]) {
							pushChildren(n[idKey]);
						}
					});
			}
			pushChildren(rootId);
			this.nodes = result;
			this.origin_parentId_childrenIds = this.origin_parentId_childrenIds||this.parentId_childrenIds;
			this.parentId_childrenIds = parentId_childrenIds;
			this._resetRender();
		} else {
			this.parentId_childrenIds = this.origin_parentId_childrenIds||this.parentId_childrenIds;
			var roots =
				this.parentId_childrenIds[this.rootId] &&
				this.parentId_childrenIds[this.rootId].map(rid => this.id_node[rid]);
			this.nodes = roots || [];
			this.searchFilter = null;
			if (this.nodes.length) {
				this.expandNode(this.nodes[0][idKey]);
			}
		}
	},
	/**
	 * 根据id刷新某个节点，包括其本身
	 * @param node - 待更新的节点数据对象
	 * @param delId - 搜索模式下，删除某个节点的id【特殊处理】
	 */
	refreshNode: function(node) {
		var oldNode = this.getNodeById(node[this.idKey]);
		if (oldNode) {
			Object.assign(oldNode, node);
			if (this.options.isParent(node)) {
				this.loadChildrenNodes(node, true).then(() => {
					var id = node[this.idKey];
					if (this._searchResult) {
						var tempNodes = this.nodes;
						this.nodes = this._nodes;
						this.closeNode(id, true);
						this.expandNode(id).then(() => {
							this._nodes = this.nodes;
							this.nodes = tempNodes;
							this.closeNode(id, true);
							this.expandNode(id);
						});
					} else {
						this.closeNode(id, true);
						this.expandNode(id);
					}
				});
			} else {
				this.render();
			}
		}
	},
	filterNode(filter) {
		this.nodeFilter = filter;
		this._resetRender();
	},
	/**************************************    原API    *************************************************/
	/**
	 * 对外接口，回显已经选择的节点
	 * @param arr - 待回显的节点数据数组
	 * @param delId - 树选组件，删除了某个已选节点的id【特殊处理】
	 */
	showSelNodes: function(ids, delId) {
		var checkeds = {};
		if (Sunset.isArray(ids) && ids.length > 0) {
			ids.forEach(id => {
				checkeds[id] = true;
			});
		}
		this.checkedIds = checkeds;
		this.render();
		this._emitCheckedNodes();
	},
	/**
	 * 对外接口，根据节点Id展开节点
	 * @param id - 待展开节点id
	 * @param isPlay - 如果是叶子节点是否播放
	 */
	expandGroupNode(id) {
		this.expandNode(id);
	},
	/**
	 * 对外接口，设置节点的focus状态
	 * @param idArr - 待设置的节点id数组或者id字符串
	 * @param isFocused - 设置是否高亮
	 */
	setFocus: function(ids, isToFocus) {
		if (Sunset.isArray(ids) && ids.length > 0) {
			if (isToFocus) {
				ids.forEach(id => {
					this.selectIds[id] = id;
				});
			} else {
				ids.forEach(id => {
					delete this.selectIds[id];
				});
			}
			this.render();
		}
	}
};

export default FastTree;
