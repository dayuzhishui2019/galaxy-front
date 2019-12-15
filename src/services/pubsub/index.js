import PubSub from "./pubsub";

var $pubsub = (window.$pubsub = new PubSub());

$pubsub.EVENTS = {
	LOGIN: "LOGIN",
	LOGOUT: "LOGOUT",
	REFRESH_TREE_CACHE: "REFRESH_TREE_CACHE",
	REFRESH_POINT_CACHE: "REFRESH_POINT_CACHE"
};
