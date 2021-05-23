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
var areaOccupation = [];
var playerOneUnits = [];
var playerTwoUnits = [];
var playerOneBases = [];
var playerTwoBases = [];
var playerOneFunds = 1000;
var playerTwoFunds = 1000;
var playerOneOperations = 3;
var playerTwoOperations = 3;
var playerTurn = 0;
var availableAreas = [];
var msg = '';


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

        io.emit('player-disconnect', serverConnections, playersReady);
        playersReady[playerIndex] = false;
    });

    //tell clients to show player connection status
    io.emit('player-connection', serverConnections, playersReady);


    //tell clients to show player ready status and start game if both players ready
    socket.on('playerReady', index => {
        console.log(`Player ${index} says ready`);
        playersReady[index] = true;
        io.emit('player-ready', playersReady);
        
        if(playersReady[0] == true && playersReady[1] == true){
            console.log("Game start");
            io.emit('game-start');

            for(var i=0; i<50; i++){
                playerOneBases[i] = 0;
                playerTwoBases[i] = 0;
                if(i==20){
                    playerOneUnits[i] = 1000;
                    playerTwoUnits[i] = 0;
                    areaOccupation[i] = "g";
                }
                else if (i==29){
                    playerTwoUnits[i] = 1000;
                    playerOneUnits[i] = 0;
                    areaOccupation[i] = "r";
                }
                else{
                    playerOneUnits[i] = 0;
                    playerTwoUnits[i] = 0;
                    areaOccupation[i] = "free";
                }
            }

            playerTurn = Math.round(Math.random());
            io.emit('player-turn', playerTurn);
        }
    });


    //unit purchase handling
    socket.on('buy-units', (playerId, unitAmount, areaNum) => {
        if(playerId == 0){
            if(areaOccupation[areaNum] == "g" && playerTurn == 0){
                let cost = unitAmount*10;
                if(playerOneFunds-cost < 0){
                    msg = "Nie masz wystarczającej liczby funduszy !";
                    socket.emit('message', msg);
                }
                else{
                    playerOneFunds = playerOneFunds - cost;
                    playerOneUnits[areaNum] = parseInt(playerOneUnits[areaNum]) + parseInt(unitAmount);
                    io.emit('buy-units-update', playerId, playerOneUnits[areaNum], playerOneFunds, areaNum);
    
                    playerOneOperations--;
                    socket.emit('operations-update', playerId, playerOneOperations);
                    
                    //function to check operations left here
                    checkOperations(playerOneOperations, playerTurn);
                }
            }
            else{
                msg = "Nie posiadasz tego obszaru !";
                socket.emit('message', msg);
            }
        }
        else{
            if(areaOccupation[areaNum] == "r" && playerTurn == 1){
                let cost = unitAmount*10;
                if(playerTwoFunds-cost < 0){
                    msg = "Nie masz wystarczającej liczby funduszy !";
                    socket.emit('message', msg);
                }
                else{
                    playerTwoFunds = playerTwoFunds - cost;
                    playerTwoUnits[areaNum] = parseInt(playerTwoUnits[areaNum]) + parseInt(unitAmount);
                    io.emit('buy-units-update', playerId, playerTwoUnits[areaNum], playerTwoFunds, areaNum);
    
                    playerTwoOperations--;
                    socket.emit('operations-update', playerId, playerTwoOperations);
                    
                    //function to check operations left here
                    checkOperations(playerTwoOperations, playerTurn);
                }
            }
            else{
                msg = "Nie posiadasz tego obszaru !";
                socket.emit('message', msg);
            }
        }
    });

    //base purchase handling
    socket.on('buy-base', (playerId, areaNum) =>{
        let cost = 500;

        if(playerId == 0){
            if(areaOccupation[areaNum] == "g" && playerTurn == 0){
                if(playerOneFunds-cost < 0){
                    msg = "Nie masz wystarczającej liczby funduszy !";
                    socket.emit('message', msg);
                }
                else{
                    if(playerOneBases[areaNum] == 1){
                        msg = "Na tym obszarze stoi już baza !";
                        socket.emit('message', msg);
                    }
                    else{
                        playerOneFunds = playerOneFunds - cost;
                        playerOneBases[areaNum] = 1;
                        io.emit('buy-base-update', playerId, playerOneFunds, areaNum);
    
                        playerOneOperations--;
                        socket.emit('operations-update', playerId, playerOneOperations);
                        checkOperations(playerOneOperations, playerTurn);
                    }
                }
            }
            else{
                msg = "Nie posiadasz tego obszaru !";
                socket.emit('message', msg);
            }
        }
        else{
            if(areaOccupation[areaNum] == "r" && playerTurn == 1){
                if(playerTwoFunds-cost < 0){
                    msg = "Nie masz wystarczającej liczby funduszy !";
                    socket.emit('message', msg);
                }
                else{
                    if(playerTwoBases[areaNum] == 1){
                        msg = "Na tym obszarze stoi już baza !";
                        socket.emit('message', msg);
                    }
                    else{
                        playerTwoFunds = playerTwoFunds - cost;
                        playerTwoBases[areaNum] = 1;
                        io.emit('buy-base-update', playerId, playerTwoFunds, areaNum);
    
                        playerTwoOperations--;
                        socket.emit('operations-update', playerId, playerTwoOperations);
                        checkOperations(playerTwoOperations, playerTurn);
                    }
                }
            }
            else{
                msg = "Nie posiadasz tego obszaru !";
                socket.emit('message', msg);
            }
        }
    });

    //checks if you can move units from specific area and calls setAvailableAreas function
    socket.on('show-available', (playerId, areaNum) => {
        if(playerId == 0){
            if(areaOccupation[areaNum] != "g" || playerTurn == 1){
                msg = "Nie możesz przenosić jednostek z obszaru, którego nie posiadasz !";
                socket.emit('message', msg);
            }
            else{
                setAvailableAreas(playerId , areaNum);
            }
        }
        else{
            if(areaOccupation[areaNum] != "r" || playerTurn == 0){
                msg = "Nie możesz przenosić jednostek z obszaru, którego nie posiadasz !";
                socket.emit('message', msg);
            }
            else{
                setAvailableAreas(playerId, areaNum);
            }
        }
    });

    //sets the available areas for moving units
    function setAvailableAreas(playerId, areaNum){
        availableAreas = [];
        let areaCase = 1;
        if(areaNum == 0){
            availableAreas.push(areaNum+11);
            availableAreas.push(areaNum+10);
            availableAreas.push(areaNum+1);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else if(areaNum == 40){
            availableAreas.push(areaNum-10);
            availableAreas.push(areaNum-9);
            availableAreas.push(areaNum+1);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else if(areaNum == 10 || areaNum == 20 || areaNum == 30){
            availableAreas.push(areaNum-10);
            availableAreas.push(areaNum-9);
            availableAreas.push(areaNum+1);
            availableAreas.push(areaNum+10);
            availableAreas.push(areaNum+11);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else if(areaNum == 19 || areaNum == 29 || areaNum == 39){
            availableAreas.push(areaNum-10);
            availableAreas.push(areaNum+9);
            availableAreas.push(areaNum-1);
            availableAreas.push(areaNum+10);
            availableAreas.push(areaNum-11);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else if(areaNum == 9){
            availableAreas.push(areaNum+10);
            availableAreas.push(areaNum+9);
            availableAreas.push(areaNum-1);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else if(areaNum == 49){
            availableAreas.push(areaNum-10);
            availableAreas.push(areaNum-11);
            availableAreas.push(areaNum-1);
            areaCase = 2;
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else if(areaNum >= 1 && areaNum <= 8){
            availableAreas.push(areaNum+1);
            availableAreas.push(areaNum-1);
            availableAreas.push(areaNum+9);
            availableAreas.push(areaNum+10);
            availableAreas.push(areaNum+11);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else if(areaNum >= 41 && areaNum <= 48){
            availableAreas.push(areaNum+1);
            availableAreas.push(areaNum-1);
            availableAreas.push(areaNum-9);
            availableAreas.push(areaNum-10);
            availableAreas.push(areaNum-11);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
        else{
            availableAreas.push(areaNum-10);
            availableAreas.push(areaNum+10);
            availableAreas.push(areaNum-11);
            availableAreas.push(areaNum+11);
            availableAreas.push(areaNum+9);
            availableAreas.push(areaNum-9);
            availableAreas.push(areaNum+1);
            availableAreas.push(areaNum-1);
            socket.emit('set-available-areas-update', playerId, availableAreas, areaCase, areaNum);
        }
    }

    //unit movement handling
    socket.on('move-units', (playerId, fromNum, toNum, movingAmount) => {
        let action = 0; //0-move to our area, 1-move to free area, 2-attack
        let hasBase = false;
        let unitSituation = 0; //0-we attack with more units, 1-we attack with less units, 2-we attack with equal units
        if(playerId == 0){
            if(movingAmount > playerOneUnits[fromNum]){
                msg = "Nie posiadasz tyle jednostek do przeniesienia !";
                socket.emit('message', msg);
            }
            else if(movingAmount == 0){
                msg = "Chcesz przenieść zero jednostek !";
                socket.emit('message', msg);
            }
            else{
                //if its ours
                if(areaOccupation[toNum] == "g" && playerTurn == 0){
                    playerOneUnits[fromNum] = parseInt(playerOneUnits[fromNum]) - parseInt(movingAmount);
                    playerOneUnits[toNum] = parseInt(playerOneUnits[toNum]) + parseInt(movingAmount);
                    action = 0;
                    io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                }
                else if(areaOccupation[toNum] == "free"){
                    //if the area is free
                    playerOneUnits[fromNum] = parseInt(playerOneUnits[fromNum]) - parseInt(movingAmount);
                    playerOneUnits[toNum] = parseInt(playerOneUnits[toNum]) + parseInt(movingAmount);
                    areaOccupation[toNum] = "g";
                    action = 1;
                    io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                }
                else{
                    //if we attack
                    playerOneUnits[fromNum] = parseInt(playerOneUnits[fromNum]) - parseInt(movingAmount);
                    action = 2;
                    //check if opponent has base
                    if(playerTwoBases[toNum] == 1){
                        hasBase = true;
                        //count overall value to check the outcome of the attack
                        overall = movingAmount - (2*playerTwoUnits[toNum]);
                        if(overall > 0){
                            unitSituation = 0;
                            areaOccupation[toNum] = "g";
                            playerTwoBases[toNum] == 0;
                            playerOneBases[toNum] == 1;
                            playerOneUnits[toNum] = movingAmount - (2*playerTwoUnits[toNum]);
                            playerTwoUnits[toNum] = 0;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else if(overall < 0){
                            unitSituation = 1;
                            playerTwoUnits[toNum] = playerTwoUnits[toNum] - movingAmount;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else{
                            unitSituation = 2;
                            playerTwoUnits[toNum] = (playerTwoUnits[toNum]*2) - movingAmount;
                            playerTwoBases[toNum] == 0;
                            playerOneBases[toNum] == 0;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                            areaOccupation[toNum] = "free";
                        }
                    }
                    else{
                        hasBase = false;
                        if(movingAmount > playerTwoUnits[toNum]){
                            unitSituation = 0;
                            areaOccupation[toNum] = "g";
                            playerOneUnits[toNum] = movingAmount - playerTwoUnits[toNum];
                            playerTwoUnits[toNum] = 0;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else if (movingAmount < playerTwoUnits[toNum]){
                            unitSituation = 1;
                            playerTwoUnits[toNum] = playerTwoUnits[toNum] - movingAmount;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else{
                            unitSituation = 2;
                            //add if with hasbase for style
                            playerTwoUnits[toNum] = playerTwoUnits[toNum] - movingAmount;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                            areaOccupation[toNum] = "free";
                        }
                    }
                }
                playerOneOperations--;
                socket.emit('operations-update', playerId, playerOneOperations);
                checkOperations(playerOneOperations, playerTurn);
            }
        }//PLAYER TWO----------------------------------------------------------------------------------------
        else{
            if(movingAmount > playerTwoUnits[fromNum]){
                msg = "Nie posiadasz tyle jednostek do przeniesienia !";
                socket.emit('message', msg);
            }
            else if(movingAmount == 0){
                msg = "Chcesz przenieść zero jednostek !";
                socket.emit('message', msg);
            }
            else{
                if(areaOccupation[toNum] == "r"){
                    playerTwoUnits[fromNum] = parseInt(playerTwoUnits[fromNum]) - parseInt(movingAmount);
                    playerTwoUnits[toNum] = parseInt(playerTwoUnits[toNum]) + parseInt(movingAmount);
                    action = 0;
                    io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                }
                else if(areaOccupation[toNum] == "free"){
                    //if the area is free
                    playerTwoUnits[fromNum] = parseInt(playerTwoUnits[fromNum]) - parseInt(movingAmount);
                    playerTwoUnits[toNum] = parseInt(playerTwoUnits[toNum]) + parseInt(movingAmount);
                    areaOccupation[toNum] = "r";
                    action = 1;
                    io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                }
                //if we attack
                else{
                    playerTwoUnits[fromNum] = parseInt(playerTwoUnits[fromNum]) - parseInt(movingAmount);
                    action = 2;
                    //check if opponent has base
                    if(playerOneBases[toNum] == 1){
                        hasBase = true;
                        //count overall value to check the outcome of the attack
                        overall = movingAmount - (2*playerOneUnits[toNum]);
                        if(overall > 0){
                            unitSituation = 0;
                            areaOccupation[toNum] = "r";
                            playerTwoBases[toNum] == 1;
                            playerOneBases[toNum] == 0;
                            playerTwoUnits[toNum] = movingAmount - (2*playerOneUnits[toNum]);
                            playerOneUnits[toNum] = 0;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else if(overall < 0){
                            unitSituation = 1;
                            playerOneUnits[toNum] = playerOneUnits[toNum] - movingAmount;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else{
                            unitSituation = 2;
                            playerOneUnits[toNum] = (playerOneUnits[toNum]*2) - movingAmount;
                            playerTwoBases[toNum] == 0;
                            playerOneBases[toNum] == 0;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                            areaOccupation[toNum] = "free";
                        }
                    }
                    else{
                        hasBase = false;
                        if(movingAmount > playerOneUnits[toNum]){
                            unitSituation = 0;
                            areaOccupation[toNum] = "r";
                            playerTwoUnits[toNum] = movingAmount - playerOneUnits[toNum];
                            playerOneUnits[toNum] = 0;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else if (movingAmount < playerOneUnits[toNum]){
                            unitSituation = 1;
                            playerOneUnits[toNum] = playerOneUnits[toNum] - movingAmount;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                        }
                        else{
                            unitSituation = 2;
                            playerOneUnits[toNum] = playerOneUnits[toNum] - movingAmount;
                            io.emit('move-units-update', playerId, fromNum, toNum, playerOneUnits[fromNum], playerOneUnits[toNum], playerTwoUnits[fromNum], playerTwoUnits[toNum], action, hasBase, unitSituation);
                            areaOccupation[toNum] = "free";
                        }
                    }
                }
                playerTwoOperations--;
                socket.emit('operations-update', playerId, playerTwoOperations);
                checkOperations(playerTwoOperations, playerTurn);
            }
        }
        checkWin();
    });
});


//function that changes the turn if needed
function checkOperations(numOfOperations, turnNum){
    if(numOfOperations == 0){
        //passive fund income given every turn
        let playerOneIncome = 0;
        let playerTwoIncome = 0;
        for(var i=0; i<50; i++){
            if(areaOccupation[i] == "g"){ playerOneIncome += 25};
            if(areaOccupation[i] == "r"){ playerTwoIncome += 25};
        }
        playerOneFunds += playerOneIncome;
        playerTwoFunds += playerTwoIncome;

        //changing turn
        if(turnNum == 0){
            playerTurn = 1;
            playerTwoOperations = 3;
            io.emit('change-turn', playerTurn, playerTwoOperations, playerTwoFunds);
        }
        if(turnNum == 1){
            playerTurn = 0;
            playerOneOperations = 3;
            io.emit('change-turn', playerTurn, playerOneOperations, playerOneFunds);
        }
    }
}

//function that checks if there is a winner
function checkWin(){
    let playerOneAmount = 0;
    let playerTwoAmount = 0;
    for(var i=0; i<50; i++){
        if(areaOccupation[i] == "g"){ playerOneAmount++ };
        if(areaOccupation[i] == "r"){ playerTwoAmount++ };
    }
    if(playerOneAmount == 50){ 
        msg = "Gracz zielony wygrywa !";
        io.emit('win-msg', msg);
    }
    else if(playerTwoAmount == 50){ 
        msg = "Gracz czerowny wygrywa !";
        io.emit('win-msg', msg);
    }
    else if(playerOneAmount == 0){ 
        msg = "Gracz czerowny wygrywa !";
        io.emit('win-msg', msg);
    }
    else if(playerTwoAmount == 0){ 
        msg = "Gracz zielony wygrywa !";
        io.emit('win-msg', msg);
    }
}