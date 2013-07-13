window.onload = function() {
 
    var messages = [];
    var socket = io.connect('http://localhost:3700');
    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var content = document.getElementById("content");
 
    socket.on('message', function (data) {
        if(data) {
            messages.push(data.mensaje);
            var html = '';
            for(var i=0; i<messages.length; i++) {
                html += messages[i] + '<br />';
            }
            content.innerHTML = html;
            $('#content').animate({scrollTop: 50 },2000 );
            
        } else {
            console.log("There is a problem:", data);
        }
    });
 
    
 
}