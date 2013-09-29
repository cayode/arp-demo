var express = require('express'),
    spawn   = require('child_process').spawn;

var app = express();

app.get('/', converter);

var port = 8000;
app.listen(port, function(){
    console.log('blur.js listening on port ' + port);
});

function converter(req, res){
    var img = req.param('img');
    if (!img){
        res.end();
        return;
    }
    console.log('converting ' + img);
    var curl = spawn(
        'curl',
        ['-s', img, '-o', '-'],
        {encoding: 'binary'}
    );
    var convert = spawn(
        'convert',
        ['-blur', '0x4', '-', '-'],
        {encoding: 'binary'}
    );
    curl.stdout.on('data', function(d){ convert.stdin.write(d); });
    curl.on('close', function(r){
        if (r !== 0){
            console.log('blur.js error: curl returned ' + r);
        }
        convert.stdin.end();
    });
    convert.stdout.pipe(res);
}

