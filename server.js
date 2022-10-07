// THE TAB SPACING IS 2 SPACES, NOT 4! I DON'T WANT TO FIX IT ALL!
/*
cd ~/Desktop/Other/Games/'Flame Potato'; node server.js
cd C:\Users\dylan\Desktop\'Flame Potato'; node server.js
*/

// I have no idea what like all of this does and how it works
// Socket.IO getting started coming in clutch!

// DON'T PUT ANY INTERVALS HERE

const { createSocket } = require('dgram');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const { start } = require('repl');
const port = 3000;

app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

function User(id) {
  this.id = id;
  this.lobby = "0";// 0 is main lobby players are in when not playing a game
  this.x = 0;
  this.y = 0;
  this.lastx = 0;
  this.dirx = 0;
  this.diry = 0;
  this.animationFrame = -1;
  // this.dashPressed = false;
  // this.hasSentData = false;
}

function Potato() {
  this.player = -1,
  this.x = 0,
  this.y = 0,
  this.attached = false
}

let users = [];
let lobbies = [[]];
let lobbiesInGame = [];// which lobbies are in the game
let maxPlayersPerLobby = 4;
let startWait = 1500;
let fps = 30;

io.on('connection', (socket) => {
  console.log(socket.id + " connected");
  users.push(new User(socket.id));

  lobbies[0].push(users[users.length - 1]);
  socket.join("0");
  io.to("0").emit("connected");// give client their user id

  socket.on("disconnect", () => {
    let id = socket.id;

    console.log(id + " disconnected");
    // get which lobby disconnected player was from
    let lobbyRemovePos = parseInt(users[getUserPos(id)].lobby);

    // remove disconnected player from users array
    users.splice(getUserPos(id), 1);
    // remove disconnected player from lobbies array
    // if else because removeFromLobby removes that lobby array
    // if it is empty, but main lobby array never is removed
    if(lobbyRemovePos > 0)
      removeFromLobby(id);
    else {
      for(let i = 0; i <= lobbies[lobbyRemovePos].length - 1; i++) {
        if(lobbies[lobbyRemovePos][i].id == id) {
          lobbies[lobbyRemovePos].splice(i, 1);
        }
      }
    }

    // kick everyone in the lobby if game is running
    if(lobbiesInGame.includes(lobbyRemovePos)) {
      // kick clients from game
      io.to(lobbyRemovePos.toString()).emit("cancel game");

      // remove lobby from lobbiesInGame
      for(let i = 0; i < lobbiesInGame.length; i++) {
        if(lobbiesInGame[i] == lobbyRemovePos) {
          lobbiesInGame.splice(i, 1);
          break;
        }
      }
    }
    else
      giveUpdatedPlayerList(lobbyRemovePos);
  });

  socket.on("create lobby", (id) => {
    // try to find an empty lobby before creating a new one
    let lobby = 1;
    // only try checking if there are more lobbies than just main

    if(lobbies.length > 1) {
      let createNew = true;
      // check each lobby
      for(let i = 1; i < lobbies.length; i++) {
        if(lobbies[i].length < 1) {
          lobby = i;
          createNew = false;
          break;
        }
      }

      // there is more than main lobby, but every lobby is not empty so create new
      if(createNew) {
        lobbies.push([]);
        lobby = lobbies.length - 1;
      }
    }
    // there is only main lobby, so just create a new lobby
    else {
      lobbies.push([]);
    }
    // set player lobby to the id of the newly created lobby
    users[getUserPos(id)].lobby = (lobby).toString();
    // add player to newly created lobby
    lobbies[lobby].push(users[getUserPos(id)]);
    // remove player from the first lobby array
    removeFromMainLobby(id);
    // actually have player join separate socket room
    socket.join(lobby.toString());

    giveUpdatedPlayerList(lobby);
  });

  socket.on("join lobby", (id, lobby) => {
    // only try to let player join lobby if it already exists,
    // if the lobby isn't empty, and if the lobby isn't already
    // in the game
    if(parseInt(lobby) > 0 && 
    parseInt(lobby) <= parseInt(lobbies.length - 1) && 
    lobbies[parseInt(lobby)].length > 0 &&
    !(lobbiesInGame.includes(parseInt(lobby)))) {
      // only allow client to join lobby if there are less than 4 players
      if(lobbies[parseInt(lobby)].length < maxPlayersPerLobby) {
        // set player lobby to requested lobby
        users[getUserPos(id)].lobby = lobby.toString();
        // actually have player join separate socket room
        socket.join(lobby.toString());
        // add player to lobby array
        lobbies[parseInt(lobby)].push(users[getUserPos(id)]);

        // remove player from the first lobby array
        removeFromMainLobby(id);

        // let the client know they successfuly joined lobby
        io.to(lobby.toString()).emit("joined lobby");

        giveUpdatedPlayerList(parseInt(lobby));
      }
    }

  });

  socket.on("go back to main lobby", (id, lobby) => {
    // first check to see if player actually needs to be removed
    // incase they were already in the first lobby
    let remove = true;
    for(let i = 0; i <= lobbies[0].length - 1; i++) {
      if(lobbies[0][i].id == id)
        remove = false;
    }
    
    if(remove) {
      if(lobbies[lobby].length <= 2 && lobbiesInGame.includes(lobby)) {

        for(let i = 0; i < lobbiesInGame.length; i++) {

          if(lobbiesInGame[i] == lobby) {
            lobbiesInGame.splice(i, 1);
            break;
          }

        }

      }
      socket.leave(lobby.toString());
      // set player lobby back to main lobby
      users[getUserPos(id)].lobby = "0";
      // add player back to first array in lobbies array
      lobbies[0].push(users[getUserPos(id)])
      // send player to first socket room
      socket.join("0");
      // if player was in a lobby other than the first, remove them
      // from that array
      removeFromLobby(id);

      giveUpdatedPlayerList(lobby);
    }
  });

  socket.on("start game attempt", (lobby) => {
    // only start the game if there is at least 2 players in lobby
    // and don't need to check for max amount of players, because that
    // is already checked when trying to join lobby
    if(lobbies[lobby].length > 1 && !(lobbiesInGame.includes(lobby))) {
      lobbiesInGame.push(lobby);
      io.to(lobby.toString()).emit("game started", gameStartData(lobby));
    }
  });

  socket.on("next round", (lobby) => {
    io.to(lobby.toString()).emit("game started", gameStartData(lobby));
  })

  // server is receiving data from a client
  socket.on("send client data", (client, lobby, potatoData, frame) => {
    let newPotatoData = new Potato;
    if(potatoData != "nothing") {
      newPotatoData.player = potatoData.player;
      newPotatoData.x = potatoData.x;
      newPotatoData.y = potatoData.y;
      newPotatoData.attached = potatoData.attached;
    }

    for(let i = 0; i < lobbies[lobby].length; i++) {
       if(lobbies[lobby][i].id == client.id) {
        lobbies[lobby][i].x = client.x;
        lobbies[lobby][i].y = client.y;
        lobbies[lobby][i].lastx = client.lastx;
        lobbies[lobby][i].dirx = client.dirx;
        lobbies[lobby][i].diry = client.diry;
        lobbies[lobby][i].animationFrame = client.animationFrame;
      }
    }

    io.to(lobby.toString()).emit("send server data", lobbies[lobby], 
      (potatoData != "nothing") ? newPotatoData : "nothing", 
      frame);
  })
});

http.listen(process.env.PORT || port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
  console.log("");
});

// get position in users array based off of user id
function getUserPos(id) {
  for(let i = 0; i <= users.length - 1; i++) {
    if(users[i].id == id) 
      return i;
  }
}

// main lobby is the first lobby or the lobby at index 0
function removeFromMainLobby(id) {
  for(let i = 0; i <= lobbies[0].length - 1; i++) {
    if(lobbies[0][i].id == id)
      lobbies[0].splice(i, 1);
  }
}

function removeFromLobby(id) {
  let lobby = -1;
  for(let i = 1; i <= lobbies.length - 1; i++) {
    for(let j = 0; j <= lobbies[i].length - 1; j++) {
      if(lobbies[i][j].id == id) {
        lobbies[i].splice(j, 1);

        lobby = i;
      }
    }
  }

  /*
  don't do this because if lobby 1 and lobby 2 have players, but then everyone
  in lobby 1 leaves, technically everyone in lobby 2 are now in lobby 1 but it's
  not updated client side. So, that could be added, but it's probably better to
  not automatically move players to a different lobby
  // remove current array just looking at if it is empty
  if(lobby != -1) {
    if(lobbies[lobby].length < 1)
      lobbies.splice(lobby, 1);
  }*/
}

// remove disconnected player from lobbies array
// if else because removeFromLobby removes that lobby array
// if it is empty, but main lobby array never is removed
function giveUpdatedPlayerList(currentLobby) {
  // incase the current lobby has already been deleted
  // such as if the player who disconnected was the only
  // person in the lobby
  if(currentLobby <= lobbies.length - 1) {
    let ids = [];

    for(let i = 0; i <= lobbies[currentLobby].length - 1; i++) {
      ids.push(lobbies[currentLobby][i].id);
    }

    io.to(currentLobby.toString()).emit("set lobby names", ids, currentLobby);
  }
}

// for when generating initial game data to test if things are too close
function touching(fromX, fromY, toX, toY) {
  return (Math.sqrt(
      Math.pow(Math.abs(toX - fromX), 2)
      +
      Math.pow(Math.abs(toY - fromY), 2)
  ) < 100);
}

// contains all data for each client to set up the game
function gameStartData(lobby) {
    let mapSize = 64;
    let mapMultiplier = 20;

    let data = {
        map: {
            size: mapSize,
            data: []
        },

        canvas: {
            mapMultiplier: 20,
            w: mapSize * mapMultiplier,
            h: mapSize * Math.floor(mapMultiplier * 0.65),
        },

        players: {
          ids: [],
          pos: []
        },
        
        potatoPlyayerId: "",
        fps: fps,
        startWait: startWait,
    };
    
    // generate map
    let mapCols = Math.ceil(data.canvas.w / data.map.size);
    let mapRows = Math.ceil(data.canvas.h / data.map.size);
    for(let y = 0; y < mapRows; y++) {
        let currentRow = [];
        
        for(let x = 0; x < mapCols; x++) {
            let tile = Math.floor(Math.random() * 16);
            
            // frames 8 and 9 are ground tiles, but are
            // different than the rest so don't use those
            // but they could be useful for something else
            // in the future, so that's why they are still
            // in the tileset
            if(tile == 8)
                --tile;
            if(tile == 9)
                ++tile;

            currentRow.push(tile);
        }

        data.map.data.push(currentRow);
    }

    // player pos
    let border = 200;
    for(let i = 0; i < lobbies[lobby].length; i++) {
        // don't check for if too close to another player with first player
        if(data.players.ids.length < 1) {
            let x = Math.floor((Math.random() * (data.canvas.w - border)) + 
            border);
            let y = Math.floor((Math.random() * (data.canvas.h - border)) + 
            border);

            data.players.ids.push(lobbies[lobby][0].id);
            data.players.pos.push([x, y]);
        }
        else {
            let generateAgain = true;
            let x, y = -1;

            while(generateAgain) {
                x = Math.floor((Math.random() * (data.canvas.w - border)) + 
                border);
                y = Math.floor((Math.random() * (data.canvas.h - border)) + 
                border);

                // check if too close to eaach other player with pos
                generateAgain = false;
                for(let j = 0; j < data.players.ids.length; j++) {
                    if(touching(x, y, 
                    data.players.pos[j][0], 
                    data.players.pos[j][1]))
                        generateAgain = true;
                }
            }

            data.players.ids.push(lobbies[lobby][i].id);
            data.players.pos.push([x, y]);
        }
    }

    // set who starts with the potato
    data.potatoPlyayerId = data.players.ids[Math.floor(
      Math.random() * data.players.ids.length)];

    return data;
}