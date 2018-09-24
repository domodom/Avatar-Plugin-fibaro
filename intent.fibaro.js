'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _helpers = require('../../node_modules/ava-ia/lib/helpers');

exports.default = function (state, actions) {
    if (state.isIntent) return (0, _helpers.resolve)(state);
    for (var rule in Config.modules.fibaro.rules) {
        var match = (0, _helpers.syntax)(state.sentence, Config.modules.fibaro.rules[rule]);
        if (match) break;
    }
    if (match) {
        state.isIntent = true;
        if (state.debug) info('IntentFibaro'.bold.green, 'syntax:', 'true'.green);
        return (0, _helpers.factoryActions)(state, actions);
    } else
        return (0, _helpers.resolve)(state);
};