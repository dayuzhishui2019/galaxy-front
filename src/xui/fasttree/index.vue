<template>
	<div style="height:100%;" class="xui-fasttree xui-fasttree-style"></div>
</template>
<script>
import FastTree from "./fasttree.js";

export default {
	props: {
		options: {}
	},
	data() {
		return {
			tree: null
		};
	},
	methods: {
		init() {
			if (this.tree) {
				this.tree.init(true);
			} else {
				this.tree = new FastTree(this.$el, this.options, this);
			}
		},
		refresh() {
			this.tree && this.tree.render();
		},
		setNodes(nodes) {
			this.tree && this.tree.setNodes(nodes);
		},
		search(keyword, force) {
			this.tree && this.tree.search(keyword, force);
		},
		removeNode(id) {
			this.tree && this.tree.removeNode(id);
		},
		refreshNode(node, removeId) {
			this.tree && this.tree.refreshNode(node, removeId);
		},
		expandNode(id) {
			this.tree && this.tree.expandNode(id);
		},
		expandCascadeNodes(ids, focusId) {
			this.tree && this.tree.expandCascadeNodes(ids, focusId);
		},
		setFocus(id, flag) {
			this.tree && this.tree.setFocus(id, flag);
		},
		clearSelected() {
			this.tree && this.tree.clearSelected();
		},
		checkNodes(ids, excludeIds) {
			// console.log("tree-index:" + ids);
			this.tree && this.tree.checkNodes(ids, excludeIds);
		},
		checkNode(id, flag, slient) {
			this.tree && this.tree.checkNode(id, flag, slient);
		},
		clearChecked() {
			this.tree && this.tree.clearChecked();
		},
		filterNode(filter) {
			this.tree && this.tree.filterNode(filter);
		}
	},
	mounted() {
		this.init();
	}
};
</script>
<style lang="less">
// @import "~style/variable.scss";
@color_primary : #2d8cf0;
@color_border : #dddee1;
@color_subcolor: #80848f;

.xui-fasttree {
	position: relative;
	height: 100%;
	overflow: hidden;
	.xui-fasttree-scroll {
		position: relative;
		height: 100%;
		overflow-y: scroll;
		overflow-x: hidden;
		margin-right: -17px;
	}
	.xui-fasttree-scroll-bar {
		position: absolute;
		right: 2px;
		bottom: 2px;
		z-index: 1;
		border-radius: 10px;
		background: fade(#ccc, 0%);
		transition: all 0.12s ease-out;
		visibility: hidden;
		&.visible {
			visibility: visible;
		}
		&.vertical {
			width: 6px;
			top: 2px;
			& > div {
				width: 100%;
			}
		}
		&:hover,
		&.hover {
			width: 10px;
			background: fade(#ccc, 50%);
		}
	}
	.xui-fasttree-scroll-bar-slider {
		position: relative;
		display: block;
		width: 100%;
		height: 0;
		cursor: pointer;
		border-radius: inherit;
		background: fade(#777, 50%);
		transition: background-color 0.3s;
		transition: height 0.3s;
	}
	.xui-fasttree-widgets {
		overflow: hidden;
		white-space: nowrap;
		vertical-align: middle;
	}

	.xui-fasttree-node {
		cursor: pointer;
		position: relative;
		user-select: none;
		&.selected {
			color: @color_primary;
		}
		&.node-__CHECK_ALL__ {
			.xui-fasttree-toggle {
				visibility: hidden;
			}
			.fasttree-node-icon {
				width: 0px !important;
			}
		}
		//expand
		.xui-fasttree-toggle {
			cursor: pointer;
			width: 15px;
			text-align: center;
			&:hover {
				color: @color_primary;
			}
			&:before {
				content: "+";
			}
			&.expand:before {
				content: "-";
			}
		}
		& > * {
			display: inline-block;
		}
		//check
		.xui-fasttree-checker {
			width: 14px;
			height: 14px;
			box-sizing: border-box;
			vertical-align: middle;
			border: 1px solid @color_border;
			text-align: center;
			display: inline-block;
			margin-left: 5px;
			&.multiple {
			}
			&.single {
				border-radius: 10px;
			}
			&.checked {
				&:before {
					content: "";
					display: inline-block;
					vertical-align: top;
					background: @color_subcolor;
					transition: all 0.3s;
					width: 10px;
					height: 10px;
					margin-top: 1px;
				}
				&.single:before {
					border-radius: 10px;
				}
			}
		}
		//operate
		.xui-fasttree-operate {
			display: inline-block;
			vertical-align: middle;
		}
	}
}
</style>


