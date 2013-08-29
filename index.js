var express = require("express");
var client = require("twitter-api").createClient();
var http= require('http');
var fs = require('fs');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/tweetLogger');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay!
  console.log('Conectado a MongoDB');
});

var tweetSchema= mongoose.Schema({
    nombre: String,
    mensaje: String,
    userAvatar: String,
    imagen: String,
    timestamp: {type: Date, default: Date.now}

});

var TweetData = mongoose.model('TweetData', tweetSchema);


// En este archivo están guardadas las claves de autentificación en al API de Twitter
var clave =require('./claves.js').clave;

client.setAuth ( 
    clave.consumer,
    clave.consumersecret, 
    clave.requesttoken,
    clave.requestsecret 
);

var app = express();
var port = 3700;
//var ip ='192.168.1.11';

app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express); 
app.get("/", function(req, res){
    res.render("page");
});

app.use(express.static(__dirname + '/public'));
var io = require('socket.io').listen(app.listen(port)); 
//var io = require('socket.io').listen(app.listen(port, ip));

console.log("Listening on port " + port);

// var num = 0,
//     max = 10;

client.stream( 'statuses/filter', { track: '#secrettest' }, function( json ){
    var tweet = JSON.parse( json );
    

    if( tweet.text && tweet.user ){
        //console.log( tweet.user.screen_name+': "'+tweet.text+'" ' + tweet.user.profile_image_url );
        
        // Así se accede a las imagenes del post

        //console.log (tweet.entities.media[0].media_url);
        if (tweet.entities.media){
            console.log("Tweet con imagen");
            io.sockets.emit('message', { nombre: tweet.user.screen_name, mensaje: tweet.text, profile_image_url:tweet.user.profile_image_url, media_image:tweet.entities.media[0].media_url  });
            var imgRe=/([-\w]+\.(?:jpg|gif|jpeg|png))/;
            var imgfile = imgRe.exec(tweet.entities.media[0].media_url);
            var filename= "./imgsDown/" + tweet.user.screen_name+ "-" + imgfile[0];
            var file = fs.createWriteStream(filename);
            var request = http.get(tweet.entities.media[0].media_url+":large", function (response){
                response.pipe(file);
            });
         
        } else {
            console.log("Tweet sin imagen");
            io.sockets.emit('message', { nombre: tweet.user.screen_name, mensaje: tweet.text, profile_image_url:tweet.user.profile_image_url  });
            var tweetData = new TweetData({nombre: tweet.user.screen_name, mensaje: tweet.text, userAvatar:tweet.user.profile_image_url, imagen: "none" });
            tweetData.save(function (err) {
                if (err) { console.log(err)} // ...
                console.log('Dato guardado');
              });
        }
        //console.log (tweet);
        //io.sockets.emit('message', { mensaje: tweet.text, profile_image_url:tweet.user.profile_image_url  });

        // if( ++num === max ){
        //     console.log('----');
        //     client.abort();
        //}
    }
} );


