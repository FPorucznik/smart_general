const express = require('express');
const path = require('path');
const http = require('http');
const PORT = 2000;
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//game data
var playersReady = [false, false];


//set static folder
app.use(express.static(path.join(__dirname, "client")));

//start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//client connection handling (2 available connections)
const serverConnections = [null, null];

//handle functions on player connections
io.on('connection', (socket) => {

    //assign player to connections only if there is a free slot
    let playerIndex = -1;
    for(const i in serverConnections){
        if(serverConnections[i] == null){
            playerIndex = i;
            serverConnections[i] = i;
            break;
        }
    }

    //log connection info on server
    socket.emit('player-index', playerIndex);
    console.log(`Player ${playerIndex} has connected`);

    //handle disconnections and tell clients to update status
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} has disconnected`);
        serverConnections[playerIndex] = null;
        playersReady[playerIndex] = false;

        io.emit('player-disconnect', serverConnections);
    });

    //tell clients to show player connection status
    io.emit('player-connection', serverConnections, playersReady);


    //tell clients to show player ready status
    socket.on('playerReady', index => {
        console.log(`Player ${index} says ready`);
        playersReady[index] = true;
        io.emit('player-ready', playersReady);
    });

});