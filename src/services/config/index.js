var config = {};

var cache = null,
	cachePromise = null;

var $config = {
	init() {
		return cachePromise = Promise.resolve(
			cache ||
				cachePromise ||
				$http({
					url: "/config/config.json"
				})
					.then(res => {
						return (config = res || {});
					})
					.then(res => {
						console.log("-------------------true");
						cachePromise = null;
						cache = true;
					})
		);
	},
	get(attr, defaultValue) {
		return Sunset.getAttribute(config, attr, defaultValue);
	}
};

export default (window.$config = $config);
