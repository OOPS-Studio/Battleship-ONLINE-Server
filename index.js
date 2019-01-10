"use strict";
var webSocketsServerPort = +process.env.PORT || 8081;
var webSocketServer = require('websocket').server;
var http = require('http');
var clients = [];

function htmlEntities(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function prepareMessage(obj){
    /*Prepare the message for use.
    return 1 and the message if the message is a move,
    return 2 and the cleaned message if the message is a text,
    return 0 and an empty string if the message is a move, but not a valid one.
    */
    if(movex && movey && typeof movex === "number" && typeof movey === "number" && obj.movex < 11 && obj.movey < 11){
        return {
            type: 1,
            movex: obj.movex,
            movey: obj.movey
        };
    }else if(obj.value && typeof obj.value === "string"){
        return {
            type: 2,
            value: htmlEntities(obj.value)
        };
    }else{
        return(0);
    }
}
var server = http.createServer(function(request,response){});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
var wsServer = new webSocketServer({
    httpServer: server
});

wsServer.on("request",function(request){
    if(clients.length > 1){
        return;
    }
    var connection = request.accept(null,request.origin);
    var index = clients.push(connection) - 1;
    var userName = "Player " + (index + 1);
    connection.on('message',function(message){
        if(message.type === 'utf8'){
            var mes = prepareMessage(message);
            if(mes.type === 0){
                return;
            }
            if(mes.type === 1){
                var obj = {
                    movex: mes.movex,
                    movey: mes.movey,
                    author: userName
                };
            }else if(mes.type === 2){
                var obj = {
                    text: mes.value,
                    author: userName
                };
            }
            var json = JSON.stringify({
                type: "text",
                data: obj
            });
            for(var i=0; i < clients.length; i++){
                clients[i].sendUTF(json);
            }
        }
    });
    connection.on('close', function(connection) {
        clients.splice(index, 1);
    });
});