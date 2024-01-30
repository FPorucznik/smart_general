# Smart General

Smart General is a multiplayer game that works in the browser and it provides gameplay for two players. The aim of the game is to take over areas of the map smartly locating/moving units. The player that takes over all areas wins.

## Functionalities
- unit purchase
- unit movement (player has to have more units than opponent to take over his area)
- buying a base (if a player has a base on an area the attacking player needs twice as much units to take over)
- turn based
- 3 operations per turn

## Tech stack
- node js (tested on version 19.8.1)
- javascript
- express 4.17.1
- socket.io 4.0.0

## Local setup guide

**Clone repo and install necessary dependencies:**
```
git clone https://github.com/FPorucznik/smart_general.git
cd smart_general
npm install
```
**Run server**
```
node server
```
**Go to http://localhost:2000 on two seperate tabs in browser to simulate two players joining**
**Enjoy !**

Demo gameplay screenshot:
<img width="948" alt="smart_gen" src="https://github.com/FPorucznik/smart_general/assets/56200864/c99956a6-6c1d-479d-80b9-249fcc287e2d">

