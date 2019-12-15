
   // Browser environment sniffing
   var inBrowser = typeof window !== 'undefined' && Object.prototype.toString.call(window) !== '[object Object]';

  
  var UA = inBrowser && window.navigator.userAgent.toLowerCase();
  var isIE = UA && UA.indexOf('trident') > 0;
  var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
  var isAndroid = UA && UA.indexOf('android') > 0;
  var isIos = UA && /(iphone|ipad|ipod|ios)/i.test(UA);
  var iosVersionMatch = isIos && UA.match(/os ([\d_]+)/);
  var iosVersion = iosVersionMatch && iosVersionMatch[1].split('_');

var hasMutationObserverBug = iosVersion && Number(iosVersion[0]) >= 9 && Number(iosVersion[1]) >= 3 && !window.indexedDB;


export default window.$nextTick = (function () {
    var callbacks = []
    var pending = false
    var timerFunc
    function nextTickHandler () {
      pending = false
      // 之所以要slice复制一份出来是因为有的cb执行过程中又会往callbacks中加入内容
      // 比如$nextTick的回调函数里又有$nextTick
      // 这些是应该放入到下一个轮次的nextTick去执行的,
      // 所以拷贝一份当前的,遍历执行完当前的即可,避免无休止的执行下去
      var copies = callbacks.slice(0)
      callbacks = []
      for (var i = 0; i < copies.length; i++) {
        copies[i]()
      }
    }
  
    /* istanbul ignore if */
    // ios9.3以上的WebView的MutationObserver有bug，
    //所以在hasMutationObserverBug中存放了是否是这种情况
    if (typeof MutationObserver !== 'undefined' && !hasMutationObserverBug) {
      var counter = 1
      // 创建一个MutationObserver,observer监听到dom改动之后后执行回调nextTickHandler
      var observer = new MutationObserver(nextTickHandler)
      var textNode = document.createTextNode(counter)
      // 调用MutationObserver的接口,观测文本节点的字符内容
      observer.observe(textNode, {
        characterData: true
      })
      // 每次执行timerFunc都会让文本节点的内容在0/1之间切换,
      // 不用true/false可能是有的浏览器对于文本节点设置内容为true/false有bug？
      // 切换之后将新值赋值到那个我们MutationObserver观测的文本节点上去
      timerFunc = function () {
        counter = (counter + 1) % 2
        textNode.data = counter
      }
    } else {
      // webpack attempts to inject a shim for setImmediate
      // if it is used as a global, so we have to work around that to
      // avoid bundling unnecessary code.
      // webpack默认会在代码中插入setImmediate的垫片
      // 没有MutationObserver就优先用setImmediate，不行再用setTimeout
      const context = inBrowser
        ? window
        : typeof global !== 'undefined' ? global : {}
      timerFunc = context.setImmediate || setTimeout
    }
    return function (cb, ctx) {
      var func = ctx
        ? function () { cb.call(ctx) }
        : cb
      callbacks.push(func)
      // 如果pending为true, 就其实表明本轮事件循环中已经执行过timerFunc(nextTickHandler, 0)
      if (pending) return
      pending = true
      timerFunc(nextTickHandler, 0)
    }
  })()