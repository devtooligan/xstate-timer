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
var immer_1 = require("@xstate/immer");
var types_1 = require("./types");
var Running = types_1.TimerStatus.Running, Idle = types_1.TimerStatus.Idle, Paused = types_1.TimerStatus.Paused;
var timerMachineConfig = {
    states: (_a = {},
        _a[Running] = {
            entry: 'enterRunning',
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
            actions: immer_1.assign(function (context) {
                context.elapsed = 0;
                context.offSet = 0;
            }),
        },
        // 	{
        // 		elapsed: _ => 0,
        // 		offSet: _ => 0,
        // 	}),
        // },
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
        cb('TICK');
    }, 1000 * context.interval);
    return function () {
        clearInterval(interval);
    };
}; };
var onTick = immer_1.assign(function (context) {
    var elapsed = Math.min((Date.now() - context.startTime) / 1000 + context.offSet, context.duration);
    context.elapsed = +elapsed.toFixed(2);
});
// {
// elapsed: context => {
// 	const elapsed = Math.min(
// 		((Date.now() - context.startTime) / 1000) + context.offSet,
// 		context.duration,
// 	);
// 	return +elapsed.toFixed(2);
// },
// }
// );
// const onPause = assign<TimerContext, TimerEvent>({
// 	elapsed: context => {
// 		const { startTime, offSet } = context;
// 		const el = (Date.now() - startTime + offSet) / 1000;
// 		return +el.toFixed(2);
// 	},
// 	offSet: context => {
// 		return context.offSet + Date.now() - context.startTime;
// 	},
// });
var onExpire = immer_1.assign(function (context) {
    context.elapsed = context.duration;
    context.offSet = 0;
});
// 	{
// 	elapsed: context => context.duration,
// 	offSet: _ => 0,
// });
var enterRunning = immer_1.assign(function (context) {
    context.startTime = Date.now();
});
// {
// 	startTime: _ => Date.now(),
// });
// const onDurationUpdate = assign<TimerContext, TimerEvent>({
// 	duration: (context, event) => {
// 		if (event.type === 'DURATION.UPDATE') {
// 			return context.duration + event?.value;
// 		}
// 		return context.duration;
// 	},
// 	offSet: context => context.duration,
// });
var timerOptions = {
    actions: {
        onTick: onTick,
        // onPause,
        enterRunning: enterRunning,
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
    return xstate_1.createMachine(__assign(__assign({}, timerMachineConfig), { initial: Running, context: context }), timerOptions);
};
exports.createTimerService = function (options) {
    var machine = exports.createTimerMachine(options);
    var service = xstate_1.interpret(machine, { devTools: true });
    return service;
};
