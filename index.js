"use strict";
var webSocketsServerPort = +process.env.PORT || 8081;//The port that this entire server will run on...
var webSocketServer = require('websocket').server;//Create a webSocket server
var http = require('http');//Import the http module
var clients = [];//Keep track of all signed in clients
var turn = 0;//Keep track of whose turn it is
var boards = [
    [
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,6,6,6,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,7,0],
        [0,5,0,0,0,0,0,0,7,0],
        [0,5,0,0,0,0,0,0,7,0],
        [0,5,0,0,4,4,0,0,7,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,8,8,8,8,8,0,0]
    ],
    [
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,5,0,0,0,0,0,0,0],
        [0,0,5,0,0,4,4,0,0,0],
        [0,0,5,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,7,0,0,0,0],
        [0,0,0,0,0,7,0,0,0,0],
        [0,0,0,0,0,7,0,0,6,0],
        [8,8,8,8,8,7,0,0,6,0],
        [0,0,0,0,0,0,0,0,6,0]
    ]
];//Keep track of both user's boards (Will eventually be recieved from the players...)

function htmlEntities(str) {//Cleans a string
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function prepareMessage(obj){
    /*Prepare the message for use.
    return 1 and the move x and y if the message is a move,
    return 2 and the cleaned message if the message is a text,
    return 0 if the message is a move, but not a valid one.
    */
    if(typeof obj.movex === "number" && typeof obj.movey === "number" && obj.movex < 10 && obj.movey < 10 && obj.movex > -1 && obj.movey > -1){//Make sure the message IS a move. NO EXCEPTIONS. Since this string isn't cleaned it MUST be clean to make it to the moves. It must also be between 1-10
        return({
            type: 1,
            movex: obj.movex,
            movey: obj.movey
        });
    }else if(typeof obj.value === "string"){//Make sure the input is a string before it can be cleaned.
        return({
            type: 2,
            value: obj.value//Clean the string
        });
    }else{//If it's not a move or a text, it will be ignored
        return(0);
    }
}
var server = http.createServer(function(request,response){});//Create an HTTP server.
server.listen(webSocketsServerPort, function() {//Listen on port 8081
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);//Let me know so that I know my code is working...
});
var wsServer = new webSocketServer({//Create a webSocket server on the HTTP one above.
    httpServer: server
});

wsServer.on("request",function(request){//When a user joins...
    if(clients.length > 1){//Make sure there aren't already 2 people playing
        return;
    }
    var connection = request.accept(null,request.origin);//Accept the connection
    var index = clients.push(connection) - 1;//Add the client's index so it can be accessed later. (And tracked)
    var userName = "Player " + (index + 1);//Give the user a name
    var json = {//Send the username to the user.
        username: userName
    };
    connection.sendUTF(JSON.stringify(json));
    connection.on('message',function(message){//When a user sends a message...
        if(message.type === 'utf8'){//Make sure it's text
            var mes = prepareMessage(JSON.parse(message.utf8Data));//Prepare the message
            var obj;
            if(mes === 0){//If the message is not a move or a text, quit.
                return;
            }else if(mes.type === 1){//If the message is a move...
                /*if(turn !== index){
                    return;
                }*/
                var value = boards[!turn][mes.movey][mes.movex];
                if((value > 0 && value < 4) || value > 8){
                    return;
                }
                obj = {
                    result: value,
                    movex: mes.movex,
                    movey: mes.movey,
                    author: index
                };
                //turn = !turn;
            }else if(mes.type === 2){//If the message is a text...
                obj = {
                    text: mes.value,
                    author: userName,
                    player: index
                };
            }
            if(obj){
                var json = JSON.stringify(obj);
                for(var i = 0;i < clients.length;i++){//Send it to all the connected clients...
                    clients[i].sendUTF(json);
                }
            }
        }
    });
    connection.on('close', function(connection){//When a user leaves...
        clients.splice(index, 1);//Delete them from the client list
    });
});