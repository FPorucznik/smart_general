
var areas = document.querySelectorAll(".area");
var ready = false;
var map = document.querySelector(".map");
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
var selectedAreaNum = 0;
var availableAreas = [];

//handle initial player connections
var socket = io();
var playerId;
socket.on('player-index', index => {
    console.log(index);
    playerId = index;
    if(parseInt(index) == -1){
        document.getElementById("readyBtn").disabled = true;
        window.location = "lobby.html";
    }
});

socket.on('player-connection', (connectedPlayers, playersReady) => {
    //console.log(index);
    setConnectionStatus(connectedPlayers, playersReady);
});

socket.on('player-disconnect', connectedPlayers => {
    //console.log(index);
    setDisconnectionStatus(connectedPlayers);
});

//set ready icons
socket.on('player-ready' , playersReady => {
    setReadyStatus(playersReady);
});

//two functions below that change visuals depending on connection or disconnection
function setConnectionStatus(connectedPlayers, playersReady){
    if(connectedPlayers[0] == 0){
        if(playersReady[1] == false){
            document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
        }
        else{
            document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
        }
        document.getElementById("playerOneStatusIconConnection").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
        document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    }
    else if(connectedPlayers[0] == null){
        document.getElementById("playerOneStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
        document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    }
    if(connectedPlayers[1] == 1){
        if(playersReady[0] == false){
            document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
        }
        else{
            document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
        }
        document.getElementById("playerTwoStatusIconConnection").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
    }
    else if(connectedPlayers[1] == null){
        document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
        document.getElementById("playerTwoStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    }
}

function setDisconnectionStatus(connectedPlayers){
    if(connectedPlayers[0] == null){
        document.getElementById("playerOneStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
        document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    }
    if(connectedPlayers[1] == null){
        document.getElementById("playerTwoStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
        document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    }
}

//update ready status icons
function setReadyStatus(playersReady){
    if(playersReady[0] == true){
        document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
    }
    if(playersReady[1] == true){
        document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
    }
}

function setReady(){
    socket.emit('playerReady', playerId);
    //ready = true;
    document.getElementById("readyBtn").disabled = true;
    //setMap(); --> move logic to server soon
}

function setMap(){
    for(var i=0; i<50; i++){
        areas[i].setAttribute("onclick", `showMenu(${i})`);
    }

    document.getElementById("units20").innerHTML = 1000;
    document.getElementById("units20").style.background = "lime";
    
    document.getElementById("units29").innerHTML = 1000;
    document.getElementById("units29").style.background = "#FD7A7A";

    areas[20].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
    areas[29].style.backgroundColor = "rgba(255, 0, 0, 0.5)";

    document.getElementById("moveNum").innerHTML = playerOneOperations;
    

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
    document.getElementById("fundsValue").innerHTML = playerOneFunds;
    playerTurn = Math.round(Math.random());

    if(playerTurn == 0) {
        document.getElementById("yourTurn").style.textDecoration = "underline";
    }
    else {
        document.getElementById("enemyTurn").style.textDecoration = "underline";
    }
}

//enable options for clicked area
function showMenu(areaNum){

    cancelMoving();
    areas[selectedAreaNum].style.boxShadow = "none";

    let moveUnitsBtn = document.getElementById("moveUnitsBtn");
    moveUnitsBtn.disabled = false;
    let buyBaseBtn = document.getElementById("buyBaseBtn");
    buyBaseBtn.disabled = false;
    let buyUnitsBtn = document.getElementById("buyUnitsBtn");
    buyUnitsBtn.disabled = false;
    let buyInput = document.getElementById("buyAmount");
    buyInput.disabled = false;

    areas[areaNum].style.boxShadow = "inset 0px 0px 14px 10px #B0FBFF";
    selectedAreaNum = areaNum;

    buyUnitsBtn.setAttribute("onclick", `buyUnits(${areaNum})`);
    moveUnitsBtn.setAttribute("onclick", `showAvailable(${areaNum})`);
    buyBaseBtn.setAttribute("onclick", `buyBase(${areaNum})`);
}

//function that handles purchase of units
function buyUnits(areaNum){
    let unitAmount = document.getElementById("buyAmount").value;

    console.log(`bought ${unitAmount} units for area ${areaNum}`);

    let buyBtn = document.getElementById("buyUnitsBtn");
    buyBtn.disabled = true;
    let buyInput = document.getElementById("buyAmount");
    buyInput.disabled = true;

    if(playerTurn == 0){
        if(areaOccupation[areaNum] == "g"){
            let cost = unitAmount*10;
            if(playerOneFunds-cost < 0){
                alert("Nie masz wystarczającej liczby funduszy !");
            }
            else{
                playerOneFunds = playerOneFunds - cost;
                playerOneUnits[areaNum] = parseInt(playerOneUnits[areaNum]) + parseInt(unitAmount);
                document.getElementById(`units${areaNum}`).innerHTML = playerOneUnits[areaNum];
                document.getElementById("fundsValue").innerHTML = playerOneFunds;

                playerOneOperations--;
                document.getElementById("moveNum").innerHTML = playerOneOperations;
                
                //function to check operations left here
                checkOperations(playerOneOperations, playerTurn);
            }
        }
        else{
            alert("Nie posiadasz tego obszaru !");
        }
    }
    else{
        if(areaOccupation[areaNum] == "r"){
            let cost = unitAmount*10;
            if(playerTwoFunds-cost < 0){
                alert("Nie masz wystarczającej liczby funduszy !");
            }
            else{
                playerTwoFunds = playerTwoFunds - cost;
                playerTwoUnits[areaNum] = parseInt(playerTwoUnits[areaNum]) + parseInt(unitAmount);
                document.getElementById(`units${areaNum}`).innerHTML = playerTwoUnits[areaNum];
                document.getElementById("fundsValue").innerHTML = playerTwoFunds;

                playerTwoOperations--;
                document.getElementById("moveNum").innerHTML = playerTwoOperations;
                
                //function to check operations left here
                checkOperations(playerTwoOperations, playerTurn);
            }
        }
        else{
            alert("Nie posiadasz tego obszaru !");
        }
    }
    areas[areaNum].style.boxShadow = "none";
}

//function that buys base
function buyBase(areaNum){
    console.log(`buying base operation for area ${areaNum}`);

    let cost = 500;

    if(playerTurn == 0){
        if(areaOccupation[areaNum] == "g"){
            if(playerOneFunds-cost < 0){
                alert("Nie masz wystarczającej liczby funduszy !");
            }
            else{
                if(playerOneBases[areaNum] == 1){
                    alert("Na tym obszarze stoi już baza !");
                }
                else{
                    playerOneFunds = playerOneFunds - cost;
                    playerOneBases[areaNum] = 1;
                    document.getElementById(`base${areaNum}`).innerHTML = "<img src='assets/base.png' id='icon'>";
                    document.getElementById("fundsValue").innerHTML = playerOneFunds;

                    playerOneOperations--;
                    document.getElementById("moveNum").innerHTML = playerOneOperations;
                    checkOperations(playerOneOperations, playerTurn);
                }
            }
        }
        else{
            alert("Nie posiadasz tego obszaru !");
        }
    }
    else{
        if(areaOccupation[areaNum] == "r"){
            if(playerTwoFunds-cost < 0){
                alert("Nie masz wystarczającej liczby funduszy !");
            }
            else{
                if(playerTwoBases[areaNum] == 1){
                    alert("Na tym obszarze stoi już baza !");
                }
                else{
                    playerTwoFunds = playerTwoFunds - cost;
                    playerTwoBases[areaNum] = 1;
                    document.getElementById(`base${areaNum}`).innerHTML = "<img src='assets/base.png' id='icon'>";
                    document.getElementById("fundsValue").innerHTML = playerTwoFunds;

                    playerTwoOperations--;
                    document.getElementById("moveNum").innerHTML = playerTwoOperations;
                    checkOperations(playerTwoOperations, playerTurn);
                }
            }
        }
        else{
            alert("Nie posiadasz tego obszaru !");
        }
    }
    areas[areaNum].style.boxShadow = "none";
}


//function that sets available areas depending on turn
function showAvailable(areaNum){
    console.log(`moving operation for area ${areaNum}`);

    let movingAmountInput = document.getElementById("moveAmount");
    movingAmountInput.disabled = false;

    //let availableAreas = [];

    if(playerTurn == 0){
        if(areaOccupation[areaNum] != "g"){
            alert("Nie możesz przenosić jednostek z obszaru, którego nie posiadasz !");
        }
        else{
            setAvailableAreas(areaNum);
        }
    }
    else{
        if(areaOccupation[areaNum] != "r"){
            alert("Nie możesz przenosić jednostek z obszaru, którego nie posiadasz !");
        }
        else{
            setAvailableAreas(areaNum);
        }
    }
}

//function that handles unit movement across the map
function moveUnits(fromNum, toNum){
    console.log(`Moving units from area ${fromNum} to area ${toNum}`);

    let movingAmount = document.getElementById("moveAmount").value;

    if(playerTurn == 0){
        if(movingAmount > playerOneUnits[fromNum]){
            alert("Nie posiadasz tyle jednostek do przeniesienia !");
        }
        else if(movingAmount == 0){
            alert("Chcesz przenieść zero jednostek !");
        }
        else{
            //if its ours
            if(areaOccupation[toNum] == "g"){
                playerOneUnits[fromNum] = parseInt(playerOneUnits[fromNum]) - parseInt(movingAmount);
                playerOneUnits[toNum] = parseInt(playerOneUnits[toNum]) + parseInt(movingAmount);
                document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
            }
            else if(areaOccupation[toNum] == "free"){
                //if the area is free
                playerOneUnits[fromNum] = parseInt(playerOneUnits[fromNum]) - parseInt(movingAmount);
                playerOneUnits[toNum] = parseInt(playerOneUnits[toNum]) + parseInt(movingAmount);
                areaOccupation[toNum] = "g";
                document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
                document.getElementById(`units${toNum}`).style.background = "lime";
                areas[toNum].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
            }
            else{
                //if we attack
                playerOneUnits[fromNum] = parseInt(playerOneUnits[fromNum]) - parseInt(movingAmount);

                //check if opponent has base
                if(playerTwoBases[toNum] == 1){
                    //count overall value to check the outcome of the attack
                    overall = movingAmount - (2*playerTwoUnits[toNum]);
                    if(overall > 0){
                        areaOccupation[toNum] = "g";
                        playerTwoBases[toNum] == 0;
                        playerOneBases[toNum] == 1;
                        playerOneUnits[toNum] = movingAmount - (2*playerTwoUnits[toNum]);
                        playerTwoUnits[toNum] = 0;
                        document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
                        document.getElementById(`units${toNum}`).style.background = "lime";
                        areas[toNum].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
                    }
                    else if(overall < 0){
                        playerTwoUnits[toNum] = playerTwoUnits[toNum] - movingAmount;
                        document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
                    }
                    else{
                        playerTwoUnits[toNum] = (playerTwoUnits[toNum]*2) - movingAmount;
                        playerTwoBases[toNum] == 0;
                        playerOneBases[toNum] == 0;
                        document.getElementById(`base${toNum}`).innerHTML = "BASE_IMG";
                        document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
                        document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                        areaOccupation[toNum] = "free";
                        document.getElementById(`units${toNum}`).style.background = "none";
                        areas[toNum].style.background = "#144703";
                    }
                }
                else{
                    if(movingAmount > playerTwoUnits[toNum]){
                        areaOccupation[toNum] = "g";
                        playerOneUnits[toNum] = movingAmount - playerTwoUnits[toNum];
                        playerTwoUnits[toNum] = 0;
                        document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
                        document.getElementById(`units${toNum}`).style.background = "lime";
                        areas[toNum].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
                    }
                    else if (movingAmount < playerTwoUnits[toNum]){
                        playerTwoUnits[toNum] = playerTwoUnits[toNum] - movingAmount;
                        document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
                    }
                    else{
                        playerTwoUnits[toNum] = playerTwoUnits[toNum] - movingAmount;
                        document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
                        document.getElementById(`units${fromNum}`).innerHTML = playerOneUnits[fromNum];
                        areaOccupation[toNum] = "free";
                        document.getElementById(`units${toNum}`).style.background = "none";
                        areas[toNum].style.background = "#144703";
                    }
                }
            }
            playerOneOperations--;
            document.getElementById("moveNum").innerHTML = playerOneOperations;
            checkOperations(playerOneOperations, playerTurn);
        }
    }
    else{
        if(movingAmount > playerTwoUnits[fromNum]){
            alert("Nie posiadasz tyle jednostek do przeniesienia !");
        }
        else if(movingAmount == 0){
            alert("Chcesz przenieść zero jednostek !");
        }
        else{
            if(areaOccupation[toNum] == "r"){
                playerTwoUnits[fromNum] = parseInt(playerTwoUnits[fromNum]) - parseInt(movingAmount);
                playerTwoUnits[toNum] = parseInt(playerTwoUnits[toNum]) + parseInt(movingAmount);
                document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
            }
            else if(areaOccupation[toNum] == "free"){
                //if the area is free
                playerTwoUnits[fromNum] = parseInt(playerTwoUnits[fromNum]) - parseInt(movingAmount);
                playerTwoUnits[toNum] = parseInt(playerTwoUnits[toNum]) + parseInt(movingAmount);
                areaOccupation[toNum] = "r";
                document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
                document.getElementById(`units${toNum}`).style.background = "#FD7A7A";
                areas[toNum].style.backgroundColor = "rgba(255, 0, 0, 0.5)";
            }
            //if we attack
            else{
                playerTwoUnits[fromNum] = parseInt(playerTwoUnits[fromNum]) - parseInt(movingAmount);

                //check if opponent has base
                if(playerOneBases[toNum] == 1){
                    //count overall value to check the outcome of the attack
                    overall = movingAmount - (2*playerOneUnits[toNum]);
                    if(overall > 0){
                        areaOccupation[toNum] = "r";
                        playerTwoBases[toNum] == 1;
                        playerOneBases[toNum] == 0;
                        playerTwoUnits[toNum] = movingAmount - (2*playerOneUnits[toNum]);
                        playerOneUnits[toNum] = 0;
                        document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
                        document.getElementById(`units${toNum}`).style.background = "#FD7A7A";
                        areas[toNum].style.backgroundColor = "rgba(255, 0, 0, 0.5)";
                    }
                    else if(overall < 0){
                        playerOneUnits[toNum] = playerOneUnits[toNum] - movingAmount;
                        document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
                    }
                    else{
                        playerOneUnits[toNum] = (playerOneUnits[toNum]*2) - movingAmount;
                        playerTwoBases[toNum] == 0;
                        playerOneBases[toNum] == 0;
                        document.getElementById(`base${toNum}`).innerHTML = "BASE_IMG";
                        document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
                        document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                        areaOccupation[toNum] = "free";
                        document.getElementById(`units${toNum}`).style.background = "none";
                        areas[toNum].style.background = "#144703";
                    }
                }
                else{
                    if(movingAmount > playerOneUnits[toNum]){
                        areaOccupation[toNum] = "r";
                        playerTwoUnits[toNum] = movingAmount - playerOneUnits[toNum];
                        playerOneUnits[toNum] = 0;
                        document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerTwoUnits[toNum];
                        document.getElementById(`units${toNum}`).style.background = "#FD7A7A";
                        areas[toNum].style.backgroundColor = "rgba(255, 0, 0, 0.5)";
                    }
                    else if (movingAmount < playerOneUnits[toNum]){
                        playerOneUnits[toNum] = playerOneUnits[toNum] - movingAmount;
                        document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
                    }
                    else{
                        playerOneUnits[toNum] = playerOneUnits[toNum] - movingAmount;
                        document.getElementById(`units${fromNum}`).innerHTML = playerTwoUnits[fromNum];
                        document.getElementById(`units${toNum}`).innerHTML = playerOneUnits[toNum];
                        areaOccupation[toNum] = "free";
                        document.getElementById(`units${toNum}`).style.background = "none";
                        areas[toNum].style.background = "#144703";
                    }
                }
            }
            playerTwoOperations--;
            document.getElementById("moveNum").innerHTML = playerTwoOperations;
            checkOperations(playerTwoOperations, playerTurn);
        }
    }
    checkWin();
    for(i in availableAreas){
        if(availableAreas[i] < 50 && availableAreas[i] > 0){
            areas[availableAreas[i]].style.boxShadow = "none";
            areas[availableAreas[i]].setAttribute("onclick", `showMenu(${availableAreas[i]})`);
        }
    }
}

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
            document.getElementById("yourTurn").style.textDecoration = "none";
            document.getElementById("enemyTurn").style.textDecoration = "underline";
            playerTwoOperations = 3;
            document.getElementById("moveNum").innerHTML = playerTwoOperations;
            document.getElementById("fundsValue").innerHTML = playerTwoFunds;
        }
        if(turnNum == 1){
            playerTurn = 0;
            document.getElementById("yourTurn").style.textDecoration = "underline";
            document.getElementById("enemyTurn").style.textDecoration = "none";
            playerOneOperations = 3;
            document.getElementById("moveNum").innerHTML = playerOneOperations;
            document.getElementById("fundsValue").innerHTML = playerOneFunds;
        }
    }
}

//function that picks the available areas to move units
function setAvailableAreas(areaNum){

    availableAreas = [];
    if(areaNum == 0){
        availableAreas.push(areaNum+11);
        availableAreas.push(areaNum+10);
        availableAreas.push(areaNum+1);
        for(i in availableAreas){
            areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
            areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
        }
    }
    else if(areaNum == 40){
        availableAreas.push(areaNum-10);
        availableAreas.push(areaNum-9);
        availableAreas.push(areaNum+1);
        for(i in availableAreas){
            areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
            areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
        }
    }
    else if(areaNum == 10 || areaNum == 20 || areaNum == 30){
        availableAreas.push(areaNum-10);
        availableAreas.push(areaNum-9);
        availableAreas.push(areaNum+1);
        availableAreas.push(areaNum+10);
        availableAreas.push(areaNum+11);
        for(i in availableAreas){
            areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
            areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
        }
    }
    else if(areaNum == 19 || areaNum == 29 || areaNum == 39){
        availableAreas.push(areaNum-10);
        availableAreas.push(areaNum+9);
        availableAreas.push(areaNum-1);
        availableAreas.push(areaNum+10);
        availableAreas.push(areaNum-11);
        for(i in availableAreas){
            areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
            areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
        }
    }
    else if(areaNum == 9){
        availableAreas.push(areaNum+10);
        availableAreas.push(areaNum+9);
        availableAreas.push(areaNum-1);
        for(i in availableAreas){
            areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
            areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
        }
    }
    else if(areaNum == 49){
        availableAreas.push(areaNum-10);
        availableAreas.push(areaNum-11);
        availableAreas.push(areaNum-1);
        for(i in availableAreas){
            areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
            areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
        }
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
        for(i in availableAreas){
            if(availableAreas[i] >= 0 && availableAreas[i] <= 49){
                areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
                areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
            }
        }
    }
}

//function that cancels unit move possibilities
function cancelMoving(){
    for(var i=0; i<50; i++){
        areas[i].style.boxShadow = "none";
        areas[i].setAttribute("onclick", `showMenu(${i})`);
    }
}

//function that checks if there is a winner
function checkWin(){
    let winner = "n";
    let playerOneAmount = 0;
    let playerTwoAmount = 0;
    for(var i=0; i<50; i++){
        if(areaOccupation[i] == "g"){ playerOneAmount++ };
        if(areaOccupation[i] == "r"){ playerTwoAmount++ };
    }
    if(playerOneAmount == 50){ console.log("green wins")}
    else if(playerTwoAmount == 50){ console.log("red wins")}
    else if(playerOneAmount == 0){ console.log("red wins") }
    else if(playerTwoAmount == 0){ console.log("green wins") }
}