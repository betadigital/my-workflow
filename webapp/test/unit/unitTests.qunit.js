/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

sap.ui.require([
	"sapui/workflowtrial/test/unit/AllTests"
], function (Controller) {
	"use strict";
	QUnit.start();
});