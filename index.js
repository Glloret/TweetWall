///////////////////////////////////////////////////////////////////////////////////
//                      TWEETWALL
///////////////////////////////////////////////////////////////////////////////////

// Hashtag a Sequir
var hashtagSeguir = '#MiFraseEnAM';


// PARÁMETROS DEL SERVIDOR IP Y PUERTO 
// ( SI SE CAMBIAN AQUÍ HAY QUE CAMBIARLOS TB  EN "/public/tweet.js")
var port = 3700;
//var ip ='192.168.1.11';


////////////////////////////////////////////////////////////////////////////////// 
var express = require("express");
var client = require("twitter-api").createClient();
var http= require('http');
var fs = require('fs');
var mongoose = require('mongoose');

// CONECTAR CON LA BASE DE DATOS
// MongoDB en localhost con el puerto por defecto
// Nombre BD: tweetLogger
mongoose.connect('mongodb://localhost/tweetLogger'); 
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB'));
db.once('open', function callback () {
  console.log('Conectado a MongoDB');
});

// FORMATO DE LOS DATOS A GUARDAR
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


app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express); 
app.get("/", function(req, res){
    res.render("page");
});

// DIRECTORIO PARA FICHEROS "PÚBLICOS" DEL SERVIDOR CSS Y JS
app.use(express.static(__dirname + '/public'));

// SOCKET.IO CONFIGURACIÓN DE LOS WEB SOCKET
var io = require('socket.io').listen(app.listen(port)); 
//var io = require('socket.io').listen(app.listen(port, ip));

console.log("Listening on port " + port);

/////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////
client.stream( 'statuses/filter', { track: hashtagSeguir }, function( json ){
    console.log("tweet recibido");
    var tweet = JSON.parse( json );
    if( tweet.text && tweet.user ){
          
        // Tweets con imágenes
        if (tweet.entities.media){
            //console.log("Tweet con imagen");
            io.sockets.emit('message', { nombre: tweet.user.screen_name, mensaje: tweet.text, profile_image_url:tweet.user.profile_image_url, media_image:tweet.entities.media[0].media_url  });
            var imgRe=/([-\w]+\.(?:jpg|gif|jpeg|png))/;

            var imgfile = imgRe.exec(tweet.entities.media[0].media_url);
            // Nombre y ubicación de los archivos de imagen que se guardan.
            var filename= "./imgsDown/" + tweet.user.screen_name+ "-" + imgfile[0];
            var file = fs.createWriteStream(filename);
            var request = http.get(tweet.entities.media[0].media_url+":large", function (response){
                response.pipe(file);
            });
         
        // Tweets sólo texto
        } else {
            //console.log("Tweet sin imagen");
            io.sockets.emit('message', { nombre: tweet.user.screen_name, mensaje: tweet.text, profile_image_url:tweet.user.profile_image_url  });
            var tweetData = new TweetData({nombre: tweet.user.screen_name, mensaje: tweet.text, userAvatar:tweet.user.profile_image_url, imagen: "none" });
            tweetData.save(function (err) {
                if (err) { console.log(err)} // ...
                console.log('Dato guardado');
              });
        }
    }
} );


