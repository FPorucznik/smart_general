var areas = document.querySelectorAll(".area");
var playerTurn = 0;
var selectedAreaNum = 0;
var availableAreas = [];

//handle initial player connections
var socket = io();
var playerId;
socket.on("player-index", (index) => {
  playerId = index;
  if (parseInt(index) == -1) {
    document.getElementById("readyBtn").disabled = true;
    alert("Server is full !");
    window.location = "lobby.html";
  }
});

socket.on("player-connection", (connectedPlayers, playersReady) => {
  setConnectionStatus(connectedPlayers, playersReady);
});

socket.on("player-disconnect", (connectedPlayers, playersReady) => {
  setDisconnectionStatus(connectedPlayers, playersReady);
});

//set ready icons
socket.on("player-ready", (playersReady) => {
  setReadyStatus(playersReady);
});
//set the map for game start
socket.on("game-start", function () {
  setMap();
});

//set style for first player turn notification
socket.on("player-turn", (index) => {
  if (index == playerId) {
    //document.getElementById("yourTurn").style.textDecoration = "underline";
    document.getElementById("yourTurn").style.border = "2px solid yellow";
  } else {
    //document.getElementById("enemyTurn").style.textDecoration = "underline";
    document.getElementById("enemyTurn").style.border = "2px solid yellow";
  }
  playerTurn = index;
});
//show messages to players
socket.on("message", (msg) => {
  alert(msg);
});

//show win info to players and move to lobby
socket.on("win-msg", (msg) => {
  alert(msg);
  window.setTimeout(function () {
    window.location.href = "lobby.html";
  }, 4000);
});
//update unit amount on map
socket.on("buy-units-update", (index, unitsAmount, fundsAmount, areaNum) => {
  document.getElementById(`units${areaNum}`).innerHTML = unitsAmount;
  if (playerId == index) {
    document.getElementById("fundsValue").innerHTML = fundsAmount;
  }
  areas[areaNum].style.boxShadow = "none";
});
//update turn notification
socket.on("change-turn", (newTurn, operations, funds) => {
  if (newTurn == playerId) {
    document.getElementById("moveNum").innerHTML = operations;
    document.getElementById("fundsValue").innerHTML = funds;
    document.getElementById("yourTurn").style.border = "2px solid yellow";
    document.getElementById("enemyTurn").style.border = "none";
  } else {
    document.getElementById("yourTurn").style.border = "none";
    document.getElementById("enemyTurn").style.border = "2px solid yellow";
  }
  playerTurn = newTurn;
});
//update operations counter for clients
socket.on("operations-update", (index, operations) => {
  if (index == playerId) {
    document.getElementById("moveNum").innerHTML = operations;
  }
});
//update the visuals on buying a base
socket.on("buy-base-update", (index, funds, areaNum) => {
  document.getElementById(`base${areaNum}`).innerHTML = "<img src='assets/base.png' id='icon'>";
  if (index == playerId) {
    document.getElementById("fundsValue").innerHTML = funds;
  }
  areas[areaNum].style.boxShadow = "none";
});
//update the visuals on available areas to move units
socket.on("set-available-areas-update", (index, availableAreas, areaCase, areaNum) => {
  if (index == playerId) {
    if (areaCase == 1) {
      for (i in availableAreas) {
        areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
        areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
      }
    } else {
      for (i in availableAreas) {
        if (availableAreas[i] >= 0 && availableAreas[i] <= 49) {
          areas[availableAreas[i]].style.boxShadow = "inset 0px 0px 27px 24px rgba(44,247,255,0.66)";
          areas[availableAreas[i]].setAttribute("onclick", `moveUnits(${areaNum}, ${availableAreas[i]})`);
        }
      }
    }
  }
});

socket.on("move-units-update", (index, fromNum, toNum, oneUnitsFrom, oneUnitsTo, twoUnitsFrom, twoUnitsTo, action, hasBase, unitSituation) => {
  if (index == 0) {
    if (action == 0) {
      document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
      document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
      cancelMoving();
    } else if (action == 1) {
      document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
      document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
      document.getElementById(`units${toNum}`).style.background = "lime";
      areas[toNum].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
      cancelMoving();
    } else if (action == 2) {
      if (hasBase == true) {
        if (unitSituation == 0) {
          document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
          document.getElementById(`units${toNum}`).style.background = "lime";
          areas[toNum].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
          cancelMoving();
        } else if (unitSituation == 1) {
          document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
          cancelMoving();
        } else {
          document.getElementById(`base${toNum}`).innerHTML = "BASE_IMG";
          document.getElementById(`units${toNum}`).innerHTML = twoUnitsTo;
          document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
          document.getElementById(`units${toNum}`).style.background = "none";
          areas[toNum].style.background = "#144703";
          cancelMoving();
        }
      } else {
        if (unitSituation == 0) {
          document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
          document.getElementById(`units${toNum}`).style.background = "lime";
          areas[toNum].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
          cancelMoving();
        } else if (unitSituation == 1) {
          document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = twoUnitsTo;
          cancelMoving();
        } else {
          document.getElementById(`units${toNum}`).innerHTML = twoUnitsTo;
          document.getElementById(`units${fromNum}`).innerHTML = oneUnitsFrom;
          document.getElementById(`units${toNum}`).style.background = "none";
          areas[toNum].style.background = "#144703";
          cancelMoving();
        }
      }
    }
  } else {
    if (action == 0) {
      document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
      document.getElementById(`units${toNum}`).innerHTML = twoUnitsTo;
      cancelMoving();
    } else if (action == 1) {
      document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
      document.getElementById(`units${toNum}`).innerHTML = twoUnitsTo;
      document.getElementById(`units${toNum}`).style.background = "#FD7A7A";
      areas[toNum].style.backgroundColor = "rgba(255, 0, 0, 0.5)";
      cancelMoving();
    } else if (action == 2) {
      if (hasBase == true) {
        if (unitSituation == 0) {
          document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = twoUnitsTo;
          document.getElementById(`units${toNum}`).style.background = "#FD7A7A";
          areas[toNum].style.backgroundColor = "rgba(255, 0, 0, 0.5)";
          cancelMoving();
        } else if (unitSituation == 1) {
          document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
          cancelMoving();
        } else {
          document.getElementById(`base${toNum}`).innerHTML = "BASE_IMG";
          document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
          document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
          document.getElementById(`units${toNum}`).style.background = "none";
          areas[toNum].style.background = "#144703";
          cancelMoving();
        }
      } else {
        if (unitSituation == 0) {
          document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = twoUnitsTo;
          document.getElementById(`units${toNum}`).style.background = "#FD7A7A";
          areas[toNum].style.backgroundColor = "rgba(255, 0, 0, 0.5)";
          cancelMoving();
        } else if (unitSituation == 1) {
          document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
          cancelMoving();
        } else {
          document.getElementById(`units${fromNum}`).innerHTML = twoUnitsFrom;
          document.getElementById(`units${toNum}`).innerHTML = oneUnitsTo;
          document.getElementById(`units${toNum}`).style.background = "none";
          areas[toNum].style.background = "#144703";
          cancelMoving();
        }
      }
    }
  }
});
//------------------------server functions above---------------------

//two functions below that change visuals depending on connection or disconnection
function setConnectionStatus(connectedPlayers, playersReady) {
  if (connectedPlayers[0] == 0) {
    if (playersReady[1] == false) {
      document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    } else {
      document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
    }
    document.getElementById("playerOneStatusIconConnection").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
    document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
  } else if (connectedPlayers[0] == null) {
    document.getElementById("playerOneStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
  }
  if (connectedPlayers[1] == 1) {
    if (playersReady[0] == false) {
      document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    } else {
      document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
    }
    document.getElementById("playerTwoStatusIconConnection").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
  } else if (connectedPlayers[1] == null) {
    document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    document.getElementById("playerTwoStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
  }
}

function setDisconnectionStatus(connectedPlayers, playersReady) {
  if (connectedPlayers[0] == null) {
    document.getElementById("playerOneStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
  }
  if (connectedPlayers[1] == null) {
    document.getElementById("playerTwoStatusIconConnection").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
    document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/notReady.png' id='notReadyIcon'>";
  }
  if (playersReady[0] == true && playersReady[1] == true) {
    alert("Your opponent has left the game");
    window.setTimeout(function () {
      window.location.href = "lobby.html";
    }, 3000);
  }
}

//update ready status icons
function setReadyStatus(playersReady) {
  if (playersReady[0] == true) {
    document.getElementById("playerOneStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
  }
  if (playersReady[1] == true) {
    document.getElementById("playerTwoStatusIconReady").innerHTML = "<img src='assets/ready.png' id='readyIcon'>";
  }
}

function setReady() {
  socket.emit("playerReady", playerId);
  document.getElementById("readyBtn").disabled = true;
}

function setMap() {
  for (var i = 0; i < 50; i++) {
    areas[i].setAttribute("onclick", `showMenu(${i})`);
  }

  document.getElementById("units20").innerHTML = 1000;
  document.getElementById("units20").style.background = "lime";

  document.getElementById("units29").innerHTML = 1000;
  document.getElementById("units29").style.background = "#FD7A7A";

  areas[20].style.backgroundColor = "rgba(35, 165, 33, 0.5)";
  areas[29].style.backgroundColor = "rgba(255, 0, 0, 0.5)";

  document.getElementById("moveNum").innerHTML = 3;
  document.getElementById("fundsValue").innerHTML = 1000;

  if (playerId == 0) {
    document.getElementById("colorInfo").innerHTML = "You are green";
    document.getElementById("colorInfo").style.color = "lime";
    document.getElementById("colorInfo").style.borderRadius = "25px";
    document.getElementById("colorInfo").style.backgroundColor = "black";
  } else {
    document.getElementById("colorInfo").innerHTML = "You are red";
    document.getElementById("colorInfo").style.color = "red";
    document.getElementById("colorInfo").style.borderRadius = "25px";
    document.getElementById("colorInfo").style.backgroundColor = "black";
  }
}

//enable options for clicked area
function showMenu(areaNum) {
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
function buyUnits(areaNum) {
  let unitAmount = document.getElementById("buyAmount").value;

  let buyBtn = document.getElementById("buyUnitsBtn");
  buyBtn.disabled = true;
  let buyInput = document.getElementById("buyAmount");
  buyInput.disabled = true;

  socket.emit("buy-units", playerId, unitAmount, areaNum);
}

//function that buys base
function buyBase(areaNum) {
  socket.emit("buy-base", playerId, areaNum);
}

//function that sets available areas depending on turn
function showAvailable(areaNum) {
  let movingAmountInput = document.getElementById("moveAmount");
  movingAmountInput.disabled = false;
  socket.emit("show-available", playerId, areaNum);
}

//function that handles unit movement across the map
function moveUnits(fromNum, toNum) {
  let movingAmount = document.getElementById("moveAmount").value;
  socket.emit("move-units", playerId, fromNum, toNum, movingAmount);
  for (i in availableAreas) {
    if (availableAreas[i] < 50 && availableAreas[i] > 0) {
      areas[availableAreas[i]].style.boxShadow = "none";
      areas[availableAreas[i]].setAttribute("onclick", `showMenu(${availableAreas[i]})`);
    }
  }
}

//function that cancels unit move possibilities
function cancelMoving() {
  for (var i = 0; i < 50; i++) {
    areas[i].style.boxShadow = "none";
    areas[i].setAttribute("onclick", `showMenu(${i})`);
  }
}
