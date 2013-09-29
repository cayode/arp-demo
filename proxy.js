var net = require('net'),
    _   = require('underscore')._;

var server = net.createServer();

var n = 0;

server.on('connection', function(c){
    var client = {
        addr: c.remoteAddress + '-' + (++n),
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
        var parts = clean_data.match(/(GET|PUT|DELETE|POST|HEAD)\s+(.*)\s+HTTP/);
        var is_img = false;
        if (parts){
            method = parts[1];
            url = parts[2];
            is_img = url.match(/\.(jpg|png|gif)/i) !== null;
            dest_host = undefined;
            console.log(client.addr + '> ' + method + ' ' + url);
            if (dest_host){
                console.log(client.addr + '> continuing proxy transaction for ' + dest_host);
                if (is_img){
                    console.log(client.addr + '> forwarding image to blur.js');
                    client.conn.write(
                        'GET ' + '/?img=' + dest_host + url + ' HTTP/1.1\r\n' +
                        'User-Agent: node/0.10.19\r\n' +
                        'Accept: */*\r\n' +
                        '\r\n'
                    );
                }
            }
        }
        if (!dest_host){
            // still looking for a Host header
            parts = clean_data.match(/Host:\s*(.*)/i);
            if (parts){
                dest_host = parts[1];
                console.log(client.addr + '> proxying for ' + dest_host);
                client.conn = net.connect(
                    is_img ? {host: 'localhost', port: 8000} : {host: dest_host, port: 80}
                );
                client.conn.on('connect', function(){
                    if (is_img){
                        console.log(client.addr + '> forwarding image to blur.js');
                        client.conn.write(
                            'GET ' + '/?img=' + dest_host + url + ' HTTP/1.1\r\n' +
                            'User-Agent: node/0.10.19\r\n' +
                            'Accept: */*\r\n' +
                            '\r\n'
                        );
                    }else if (client.buffered.length){
                        client.conn.write(client.buffered);
                    }
                    client.buffered = '';
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
        if (is_img === false){
            if (client.conn){
                client.conn.write(clean_data);
            }else{
                client.buffered += clean_data;
            }
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
    console.log('proxy.js error: ' + JSON.stringify(e));
});

server.listen(80, function(){
    console.log('proxy.js listening on port 80');
});


