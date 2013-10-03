window.onload = function() {
 
    var messages = [];
    //var socket = io.connect('http://192.168.1.11:3700');
    var socket = io.connect('127.0.0.1:3700');
    
    var content = $('#content');
    var scroll=500;
    socket.on('message', function (data) {
        if(data.media_image) {

            html='<div class="tweet"> <div class="avatar"> <div class="avatar_img"> <img src="'+ data.profile_image_url +'"/> </div> <div class="nombre">'+ data.nombre +'</div> </div> <div class="texto">' + data.mensaje + '<img src="'+ data.media_image +'"/> </div> </div>';
            //$('#content').prepend(html);
            $(html).clone().hide().prependTo('#content').slideDown('slow');
            //scroll = scroll + $('body>div>div.tweet:last-child').height()+300;
            //$('#content').animate({scrollTop: scroll },500);
            
        } else if (data){
            html='<div class="tweet"> <div class="avatar"> <div class="avatar_img"> <img src="'+ data.profile_image_url +'"/> </div> <div class="nombre">'+ data.nombre +'</div> </div> <div class="texto">'+ data.mensaje + '</div> </div>';
            $(html).clone().hide().prependTo('#content').slideDown('slow');
            //scroll = scroll + $('body>div>div.tweet:last-child').height()+300;
            //$('#content').animate({scrollTop: scroll },500 );
            
        } else {
            console.log("There is a problem:", data);

        }
    });
 
    
 
}
