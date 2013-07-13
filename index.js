var express = require("express");
var client = require("twitter-api").createClient();
var clave =require('./claves.js').clave;
//console.log(clave);

client.setAuth ( 
    clave.consumer,
    clave.consumersecret, 
    clave.requesttoken,
    clave.requestsecret 
);



var app = express();
var port = 3700;



app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express); 
app.get("/", function(req, res){
    res.render("page");
});

app.use(express.static(__dirname + '/public'));
var io = require('socket.io').listen(app.listen(port));

console.log("Listening on port " + port);

var num = 0,
    max = 10;

client.stream( 'statuses/filter', { track: '#bodatest' }, function( json ){
    var tweet = JSON.parse( json );
    if( tweet.text && tweet.user ){
        console.log( tweet.user.screen_name+': "'+tweet.text+'" ' + tweet.user.profile_image_url );
        io.sockets.emit('message', { mensaje: tweet.text});

        if( ++num === max ){
            console.log('----');
            client.abort();
        }
    }
} );


