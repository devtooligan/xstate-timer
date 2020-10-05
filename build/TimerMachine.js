"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var xstate_1 = require("xstate");
var types_1 = require("./types");
var Running = types_1.TimerStatus.Running, Idle = types_1.TimerStatus.Idle, Paused = types_1.TimerStatus.Paused;
var timerMachineConfig = {
    states: (_a = {},
        _a[Running] = {
            always: {
                target: Idle,
                cond: 'checkExpired',
            },
            invoke: {
                src: 'ticker',
            },
            on: {
                PAUSE: {
                    target: 'paused',
                },
                TICK: {
                    actions: 'onTick',
                },
            },
        },
        _a[Paused] = {
            entry: 'onPause',
            on: {
                UNPAUSE: {
                    target: Running,
                    actions: 'onUnpause',
                },
            },
        },
        _a[Idle] = {
            always: {
                target: Running,
                cond: 'checkDuration',
            },
        },
        _a),
    on: {
        RESET: {
            target: Running,
            actions: xstate_1.assign({
                elapsed: function (_) { return 0; },
                offSet: function (_) { return 0; },
                startTime: function (_) { return Date.now(); },
            }),
        },
        'DURATION.UPDATE': {
            actions: 'onDurationUpdate',
        },
    },
};
var checkExpired = function (context) {
    return context.elapsed >= context.duration;
};
var checkDuration = function (context) {
    return context.elapsed < context.duration;
};
var ticker = function (context) { return function (cb) {
    var interval = setInterval(function () {
        console.log('actor sending tick');
        cb('TICK');
    }, 1000 * context.interval);
    return function () {
        clearInterval(interval);
    };
}; };
var onTick = xstate_1.assign({
    elapsed: function (context) {
        var elapsed = Math.min((Date.now() - context.startTime + context.offSet) / 1000, context.duration);
        return +elapsed.toFixed(2);
    },
});
var onPause = xstate_1.assign({
    elapsed: function (context) {
        var startTime = context.startTime, offSet = context.offSet;
        var el = (Date.now() - startTime + offSet) / 1000;
        return +el.toFixed(2);
    },
    offSet: function (context) {
        return context.offSet + Date.now() - context.startTime;
    },
});
var onExpire = xstate_1.assign({
    elapsed: function (context) { return context.duration; },
    offSet: function (_) { return 0; },
});
var onUnpause = xstate_1.assign({
    startTime: function (_) { return Date.now(); },
});
var onDurationUpdate = xstate_1.assign({
    duration: function (context, event) {
        if (event.type === 'DURATION.UPDATE') {
            return context.duration + (event === null || event === void 0 ? void 0 : event.value);
        }
        return context.duration;
    },
    startTime: function (_) { return Date.now(); },
});
var timerOptions = {
    actions: {
        onTick: onTick,
        onPause: onPause,
        onUnpause: onUnpause,
        onExpire: onExpire,
    },
    guards: {
        checkExpired: checkExpired,
        checkDuration: checkDuration,
    },
    activities: {},
    delays: {},
    services: {
        ticker: ticker,
    },
};
exports.createTimerMachine = function (options) {
    var context = __assign(__assign({ interval: 0.1 }, options), { offSet: 0, elapsed: 0, startTime: Date.now() });
    return xstate_1.createMachine(__assign(__assign({}, timerMachineConfig), { initial: 'running', context: context }), timerOptions);
};
exports.createTimerService = function (options) {
    var machine = exports.createTimerMachine(options);
    var service = xstate_1.interpret(machine, { devTools: true });
    return service;
};
