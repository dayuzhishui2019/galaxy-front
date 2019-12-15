function injectObject(element, callback) {
    var OBJECT_STYLE =
        'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; padding: 0; margin: 0; opacity: 0; z-index: -1000; pointer-events: none;';
    var object = document.createElement('object');
    object.style.cssText = OBJECT_STYLE;
    object.tabIndex = -1;
    object.type = 'text/html';
    object.data = 'about:blank';
    object.isResizeElm = true;
    object.onload = () => {
        object.contentDocument.defaultView.addEventListener('resize', callback, false)
    };
    element.appendChild(object);
    return function destroy() {
        if (object.contentDocument) {
            callback();
        }
        element.removeChild(object);
    };
}

export default function listenResize(element, callback) {
    return injectObject(element, callback);
}