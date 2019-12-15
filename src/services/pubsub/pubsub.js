/**
 * 事件订阅发布
 *
 */
var PubSub = function(context) {
	this.context = context;
	this.callbacks = {};
};
PubSub.prototype = {
	/**
	 * 获取回调集合
	 */
	_getCallbacks: function() {
		return this.callbacks || (this.callbacks = {});
	},
	/**
	 * 注册事件
	 * @param  {[type]}   ev       事件名称
	 * @param  {Function} callback 回调
	 * @return {[type]}            [description]
	 */
	subscribe: function(ev, callback) {
		var callbacks = this._getCallbacks();
		if (typeof callback == "function") {
			(callbacks[ev] || (callbacks[ev] = [])).push(callback);
		} else if (Object.prototype.toString.call(callback) === "[object Array]") {
			var singleCb;
			for (var i = 0, l = callback.length; i < l; i++) {
				if (typeof (singleCb = callback[i]) == "function") {
					(callbacks[ev] || (callbacks[ev] = [])).push(singleCb);
				}
			}
		}
	},
	/**
	 * 发布事件
	 * @return {[type]} [description]
	 */
	publish: function() {
		var callbacks = this._getCallbacks();
		var args = Array.prototype.slice.call(arguments, 0),
			ev = args.shift(),
			calls = callbacks[ev];
		if (ev && calls) {
			var l;
			if ((l = calls.length) == 1) {
				return calls[0].apply(this.context, args);
			} else {
				for (var i = 0; i < l; i++) {
					calls[i].apply(this.context, args);
				}
			}
		}
	},
	/**
	 * 发布事件
	 * @return {[type]} [description]
	 */
	publishAsync: function() {
		var callbacks = this._getCallbacks();
		var args = Array.prototype.slice.call(arguments, 0),
			ev = args.shift(),
			calls = callbacks[ev],
			self = this;
		if (ev && calls) {
			var l;
			if ((l = calls.length) == 1) {
				setTimeout(function() {
					calls[0].apply(self.context, args);
				});
			} else {
				for (var i = 0; i < l; i++) {
					(function(i) {
						setTimeout(function() {
							calls[i].apply(self.context, args);
						});
					})(i);
				}
			}
		}
	},
	/**
	 * 取消订阅
	 * @param  {[type]}   ev       事件名称
	 * @param  {Function} callback 回调函数
	 * @return {[type]}            [description]
	 */
	unsubscribe: function(ev, callback) {
		var callbacks = this._getCallbacks();
		var cbs;
		if ((cbs = callbacks[ev])) {
			if (callback) {
				for (var i = 0, l = cbs.length; i < l; i++) {
					if (cbs[i] === callback) {
						cbs.slice(i);
					}
				}
			} else {
				callbacks[ev] = null;
			}
		}
	},
	/**
	 * 注册事件集合
	 * @param  {[type]} events [description]
	 * @return {[type]}        [description]
	 */
	regist: function(events) {
		if (events) {
			for (var ev in events) {
				if (events.hasOwnProperty(ev)) {
					this.subscribe(ev, events[ev]);
				}
			}
		}
		return this;
	}
};

export default PubSub;
