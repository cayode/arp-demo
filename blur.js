var http = require('http'),
    _ = require('underscore')._;

http.createServer(function(req, res){
    console.log(req.method + ' http://' + req.host + req.url + '\n');
    console.log(JSON.stringify(req.headers) + '\n');
    __dump(req, {depth: 4});
    res.end('Hello world\n');
}).listen(80);


var __dump_indent = 0;
var __dump_accum = '';

function __writelog(s) {
    console.log(s);
    __dump_accum += s + '\n';
}

function __dumpf(func) {
    var str = '' + func;
    var ar = str.split(/\n/);
    for (var r = 0; r < ar.length; ++r) {
        __writelog(ar[r]);
    }
}

var __dump = function (o, args) {
    if (__dump_indent === 0){
        __dump_accum = '';
        __writelog('DUMP START -------------------------------------------');
    }

    if (o === null){
        __writelog('(null)');
        __writelog('DUMP END ---------------------------------------------');
        return;
    }

    if (typeof(args) === 'undefined' || args === null){
        args = {};
    }
    if (typeof(args) === 'string'){
        args = {name: args};
    }
    if (typeof(args.depth) === 'undefined'){
        args.depth = 16;
    }
    if (typeof(args.name) === 'undefined'){
        args.name = 'Dump';
    }
    if (typeof(args.functions) === 'undefined'){
        args.functions = 'stub';
    }
    __writelog(args.name + ' {');
    ++__dump_indent;
    var idt = '';
    for (var i = 0; i < __dump_indent; ++i){
        idt += '    ';
    }
    for (var i in o){
        if (!o.hasOwnProperty(i)) continue;
            args.name = idt + typeof(o[i]) + ': ' + i;
            if (typeof(o[i]) === 'object'){
                if (o[i] === null){
                    __writelog(args.name + ' = null');
                }else if (__dump_indent < args.depth){
                    __dump(o[i], args);
                }else{
                    __writelog(args.name);
                }
            }else if (typeof(o[i]) === 'function'){
            if (args.functions === 'full'){
                __writelog(args.name);
                __dumpf(o[i]);
            }else if (args.functions === 'stub'){
                __writelog(args.name);
            }
        }else{
            __writelog(args.name + ' = ' + o[i]);
        }
    }
    --__dump_indent;
    idt = '';
    for (var i = 0; i < __dump_indent; ++i){
        idt += '    ';
    }
    __writelog(idt + '}');
    if (__dump_indent === 0){
        __writelog('DUMP END ---------------------------------------------');
    }
};

