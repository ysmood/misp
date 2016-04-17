var nisp = require("../core");
var Promise = require("yaku");
var yutils = require("yaku/lib/utils");

var fns = {
    plain: require("../fn/plain"),
    plainSpread: require("../fn/plainSpread"),
    plainAsync: require("../fn/plainAsync"),
    args: require("../fn/args")
};

var langs = {
    do: require("../lang/do"),
    if: require("../lang/if"),
    plain: require("../lang/plain"),
    def: require("../lang/def"),
    fn: require("../lang/fn"),
    concat: require("../lang/concat"),

    add: fns.plain(function (args) {
        return args.reduce(function (s, v) {
            return s += v;
        });
    })
};

module.exports = function (it) {

    it.describe("basic", function (it) {
        it("number", function () {
            return it.eq(nisp(1), 1);
        });

        it("string", function () {
            return it.eq(nisp("ok"), "ok");
        });

        it("object", function () {
            return it.eq(nisp({ a: "ok" }), { a: "ok" });
        });

        it("null", function () {
            return it.eq(nisp(null), null);
        });

        it("null array", function () {
            return it.eq(nisp([null]), [null]);
        });

        it("array number", function () {
            return it.eq(nisp([1, 2]), [1, 2]);
        });

        it("plain", function () {
            return it.eq(nisp(["p", [1, "ok"]], {
                "p": langs.plain
            }), [1, "ok"]);
        });

        it("env", function () {
            var sandbox = {
                "env": function (run, ast, sandbox, env) {
                    return env;
                }
            };

            var env = "ok";

            return it.eq(nisp(["env"], sandbox, env), "ok");
        });

        it("def", function () {
            var sandbox = {
                do: langs.do,
                "+": langs.add,
                "@": langs.fn,
                def: langs.def
            };

            var ast = ["do",
                ["def", "foo",
                    ["@", ["a", "b"],
                        ["+", ["a"], ["b"]]
                    ]
                ],
                ["foo", 1, 2]
            ];

            return it.eq(nisp(ast, sandbox), 3);
        });

        it("concat", function () {
            var sandbox = {
                concat: langs.concat
            };

            var ast = ["concat", 1, [2], null, [[3]]];

            return it.eq(nisp(ast, sandbox), [ 1, 2, null, [ 3 ] ]);
        });

        it("custom if", function () {
            var sandbox = {
                "+": langs.add,
                "?": langs.if
            };

            var ast = ["?", ["+", 0, ["+", 1, 0]], 1, 2];

            return it.eq(nisp(ast, sandbox), 1);
        });

        it("custom fn", function () {
            var sandbox = {
                "do": langs.do,
                "+": langs.add,
                "def": langs.def,
                "@": langs.fn
            };

            var ast = ["do",
                ["def", "c", 10],
                ["def", "foo",
                    ["@", ["a", "b"],
                        ["def", "c", 1],
                        ["+", ["a"], ["b"], ["c"]]
                    ]
                ],
                ["foo", 1, ["+", 1, 1]]
            ];

            return it.eq(nisp(ast, sandbox), 4);
        });

        it("fns.plainSpread", function () {
            var sandbox = {
                "+": fns.plainSpread(function (a, b) {
                    return a + b;
                })
            };

            var ast = ["+", 1, 1];

            return it.eq(nisp(ast, sandbox), 2);
        });

        it("fns.args", function () {
            var sandbox = {
                "+": fns.args(function (args) {
                    return args(0) + args(1);
                })
            };

            var ast = ["+", 1, 1];

            return it.eq(nisp(ast, sandbox), 2);
        });

        it("fn as arg", function () {
            var sandbox = {
                foo: fns.plain(function (args) {
                    return args[0] + 1;
                }),

                add: fns.args(function (args) {
                    return args(0, "fn", 1) + args(1, "fn", 1);
                })
            };

            var ast = ["add", "foo", "foo"];

            return it.eq(nisp(ast, sandbox), 4);
        });

        it("anonymous fn", function () {
            var sandbox = {
                fn: langs.fn
            };

            var ast = [["fn", ["a"], ["a"]], "ok"];

            return it.eq(nisp(ast, sandbox), "ok");
        });

        it("fns.plainAsync", function () {
            var sandbox = {
                "get": fns.plainAsync(function (args, env) {
                    return yutils.sleep(13, args[0] + env);
                }, Promise),
                "+": fns.plainAsync(function (args) {
                    return yutils.sleep(13).then(function () {
                        return args[0] + args[1];
                    });
                }, Promise)
            };

            var ast = ["+", ["get", 1], ["get", 2]];

            return it.eq(nisp(ast, sandbox, 1), 5);
        });
    });
};
