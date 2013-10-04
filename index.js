///////////////////////////////////////////////////////////////////////////////////
//                      TWEETWALL
///////////////////////////////////////////////////////////////////////////////////

// Hashtag a Sequir
var hashtagSeguir = '#DíaMundialDeLaSonrisa';
var imgDirectory = './public/imgsDown/';
var imgBaseURL = 'imgsDown/';


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

// CREAR EL DIRECTORIO DE IMÁGENES SI NO EXISTE
if (!fs.existsSync(imgDirectory)) {
    fs.mkdirSync(imgDirectory);
}

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
    res.render("page", { hashtag:  hashtagSeguir });
});

// DIRECTORIO PARA FICHEROS "PÚBLICOS" DEL SERVIDOR CSS Y JS
app.use(express.static(__dirname + '/public'));

// SOCKET.IO CONFIGURACIÓN DE LOS WEB SOCKET
var io = require('socket.io').listen(app.listen(port)); 
//var io = require('socket.io').listen(app.listen(port, ip));

console.log("Listening on port " + port);

/////////////////////////////////////////////////////////////////////////////////

function cargarTweet(tweet)
{

    var tweetData;
    var imgRe=/([-\w]+\.(?:jpg|gif|jpeg|png))/;
    var s=tweet.user.profile_image_url;  
    var avatarImgURL = imgBaseURL + "avatar_" + s.substring(s.lastIndexOf('/')+1);

    // Tweets con imágenes
     if (tweet.entities.media){
        //console.log("Tweet con imagen");   
        var imgfile = imgRe.exec(tweet.entities.media[0].media_url);
        // Nombre y ubicación de los archivos de imagen que se guardan.
        var attImgFilename= imgDirectory + tweet.user.screen_name+ "-" + imgfile[0];
        var image_url = imgBaseURL + tweet.user.screen_name+ "-" + imgfile[0];
        var file = fs.createWriteStream(attImgFilename);
        // Cuando acabemos de guardar la imagen mandamos los datos para mostrar el tweet
        file.on('finish', function() {
                io.sockets.emit('message', { nombre: tweet.user.screen_name, mensaje: tweet.text, profile_image_url:avatarImgURL, media_image:image_url  });
            });           
        var request = http.get(tweet.entities.media[0].media_url+":large", function (response){
            response.pipe(file);
        });
        console.log(attImgFilename);
        // Datos del tweet para guardar luego en la base de datos
        tweetData = new TweetData({nombre: tweet.user.screen_name, mensaje: tweet.text, userAvatar:avatarImgURL, imagen: tweet.user.screen_name+ "-" + imgfile[0] });       
    // Tweets sólo texto
    } else {
        //console.log("Tweet sin imagen");
        // Enviamos los datos para mostrar el tweet
        io.sockets.emit('message', { nombre: tweet.user.screen_name, mensaje: tweet.text, profile_image_url:avatarImgURL  });
        // Datos para guardar más tarde en la base de datos
        tweetData = new TweetData({nombre: tweet.user.screen_name, mensaje: tweet.text, userAvatar:avatarImgURL, imagen: "none" });
    }

    // Guardamos en la base de datos el tweet
    tweetData.save(function (err) {
            if (err) { console.log(err)} // ...
            console.log('Dato guardado');
          });
}




///////////////////////////////////////////////////////////////////
client.stream( 'statuses/filter', { track: hashtagSeguir }, function( json ){
    console.log("tweet recibido");
    var tweet = JSON.parse( json );
    if( tweet.text && tweet.user ){

        // Nombre del archivo de imagen del avatar
        var s = tweet.user.profile_image_url;
        console.log(s.substring(s.lastIndexOf('/')+1));
        var avatarImgFilename = imgDirectory + "avatar_" + s.substring(s.lastIndexOf('/')+1);
        
        // Si ya tenemos la imagen del avatar cargamos el tweet. Si no, 
        // lo descargamos y cuando terminemos seguimos con la carga del tweet.
        if (!fs.existsSync(avatarImgFilename)) {
            var f = fs.createWriteStream(avatarImgFilename);                
            var request = http.get(tweet.user.profile_image_url, function (response){
                response.pipe(f);
            });
            f.on('finish', function(){
                cargarTweet(tweet); } );
        } else {
            cargarTweet(tweet);
        }

        
    } 
} );



