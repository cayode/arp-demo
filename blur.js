var net = require('net'),
    _ = require('underscore')._;

var server = net.createServer();

var n = 0;

server.on('connection', function(c){
    var client = {
        addr: c.remoteAddress + '|' + (++n),
        conn: undefined,
        buffered: ''
    };
    var url = undefined;
    var method = undefined;
    var dest_host = undefined; // In this case c.localAddress is set to OUR address,
                               // not the intercepted address that came in over the wire.
                               // Better hope they set a Host header!

    console.log(client.addr + ' connected');


    c.on('data', function(chunk){
        var clean_data = chunk.toString('utf-8');
        //clean_data = clean_data.replace(/accept-encoding.*/i, 'Accept-encoding:');
        var a = clean_data.match(/(GET|PUT|DELETE|POST|HEAD)\s+(.*)\s+HTTP/);
        if (a){
            method = a[1];
            url = a[2];
            console.log(client.addr + '> ' + method + ' ' + url);
            if (dest_host){
                console.log('Continuing proxy transaction for ' + client.addr + '->' + dest_host);
            }
        }
        if (!dest_host){
            // still looking for a Host header
            a = clean_data.match(/Host:\s*(.*)/i);
            if (a){
                dest_host = a[1];
                console.log('Proxying ' + client.addr + ' for ' + dest_host);
                client.conn = net.connect({host: dest_host, port: 80});
                client.conn.on('connect', function(){
                    if (client.buffered.length){
                        client.conn.write(client.buffered);
                        client.buffered = '';
                    }
                });
                client.conn.on('data', function(resp_data){
                    c.write(resp_data);
                });
                client.conn.on('error', function(e){
                    console.log(client.addr + '> Error (server): ' + JSON.stringify(e));
                    c.end();
                });
                client.conn.on('end', function(){
                    c.end();
                });
            }
        }
        //console.log(client.addr + '> ' + clean_data);
        if (client.conn){
            client.conn.write(clean_data);
        }else{
            client.buffered += clean_data;
        }
    });
    c.on('error', function(e){
        console.log(client.addr + '> Error (client): ' + JSON.stringify(e));
    });
    c.on('end', function(){
        console.log(client.addr + ' disconnected\n');
    });

});

server.on('error', function(e){
    __dump(e, {name: 'Error', depth: 5});
});

server.listen(80, function(){
    console.log('blur.js listening on port 80');
});


// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

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

