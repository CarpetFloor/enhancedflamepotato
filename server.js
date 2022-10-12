// tab space might still be 2, or maybe a combination of 2 and 4

const mapSize = 64;
const mapMultiplier = 20;
const w = mapSize * mapMultiplier;
const h = mapSize * Math.floor(mapMultiplier * 0.65)

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
  this.mobile = false
  this.id = id,
  this.skin = -1,
  this.lobby = "0", // 0 is main lobby players are in when not playing a game
  this.maxSkins = 4,
  this.rows = 4,
  this.cols = 8,
  this.animationFrame = 0,
  this.maxAnimationFrame = 3,
  this.animationWaitFrame = 0,
  this.maxAnimationWaitFrame = 2,
  this.x = w / 2,
  this.y = h / 2,
  this.width = 64,
  this.height = 80,
  this.diry = 0,
  this.dirx = 0,
  this.lastx = 1,// for setting correct frame direction
  /*if player stops moving right away after pressing dash
  then dash will stop because player dirx and/ or diry are 0
  so this ensures that the player will do the full dash after
  pressing dash even if they stop moving because the dash
  will be based off of direction they are facing when pressing
  the dash button*/
  this.dashDirx = 0,
  this.dashDiry = 0,
  this.canMovex = true,
  this.canMoveY = true,
  this.speed = 23,
  this.dashPressed = false,
  this.canDash = true,
  this.dashMultiplier = 4,
  this.dashFrame = 0,
  this.maxDashFrame = 8,
  this.dashWaitFrame = maxDashWaitFrame,// global var because clients need value and this seemed easier
  // right, bottom-right, bottom, bottom-left, left, top-left, top, top-right
  this.lastDir = 0,
  this.hasSentData = false,
  this.processInput = function() {
      // dash
      // only allow dash if moving
      // don't need to check if not mobile because when mobile,
      // dashPressed is never set to true
      if(this.dashPressed) {
          if(this.dashFrame == 0) {
              this.canDash = false;
              this.dashWaitFrame = 0;
          }

          //dashEffectR.moveTo(this.x, this.y);
          
          if(!this.mobile) {
              // diagonal dash
              // needs to be normalized
              // and only allow movement on one axis if
              // at the border on the other axis
              if(this.dashDirx != 0 && this.dashDiry != 0) {
                  if(this.canMovex) {
                      this.x += 
                      (this.speed / (Math.sqrt(Math.pow(this.speed, 2) + 
                      Math.pow(this.speed, 2)))) * this.speed * this.dashMultiplier 
                      * this.dashDirx;
                  }
                  if(this.canMovey) {
                      this.y += 
                      (this.speed / (Math.sqrt(Math.pow(this.speed, 2) + 
                      Math.pow(this.speed, 2)))) * this.speed * this.dashMultiplier 
                      * this.dashDiry;
                  }
              }
              // left or right
              else if(this.dashDirx != 0) {
                  if(this.canMovex)
                      this.x += this.speed * this.dashMultiplier * this.dashDirx;
              }
              else if(this.dashDiry != 0) {
                  if(this.canMovey)
                      this.y += this.speed * this.dashMultiplier * this.dashDiry; 
              }
          }
          // else {
          //     if(this.canMovex)
          //         this.x += joystickData.movex * this.dashMultiplier;
          //     if(this.canMovey)
          //         this.y += joystickData.movey * this.dashMultiplier;
          // }

          // change counter for how many frames in dash
          // and then if reached max frames stop dash
          ++this.dashFrame;
          if(this.dashFrame >= this.maxDashFrame) {
              this.dashPressed = false;
              this.dashFrame = 0;
          }
      }
      // when dash is not occuring, increase frame counter for how
      // wait until dash can occur again
      else if(this.dashWaitFrame < maxDashWaitFrame) {
          ++this.dashWaitFrame;

          // reached max amount of wait frames
          if(this.dashWaitFrame >= maxDashWaitFrame)
              this.canDash = true;
      }

      let margin = 10;
      // if(this.mobile) {
      //     if(joystickData.movex > 0)
      //         this.dirx = 1;
      //     if(joystickData.movex < 0)
      //         this.dirx = -1;
      //     if(joystickData.movey > 0)
      //         this.diry = 1;
      //     if(joystickData.movey < 0)
      //         this.diry = -1;
      // }
      
      // don't allow movement past screen border
      // x
      if(this.x > margin && this.x < w + margin) {
          this.canMovex = true;
      }
      else if(this.x <= margin && this.dirx == 1) {
          this.canMovex = true;
      }
      else if((this.x >= w - margin) && this.dirx == -1) {
          this.canMovex = true;
      }
      else
          this.canMovex = false;
      
      // y
      if(this.y > margin && this.y < h + margin) {
          this.canMovey = true;
      }
      else if(this.y <= margin && this.diry == 1) {
          this.canMovey = true; 
      }
      else if((this.y >= h - margin) && this.diry == -1) {
          this.canMovey = true;
      }
      else
          this.canMovey = false;

      if(!this.mobile) {
          // actual movement of player
          // diagonal
          if(this.dirx != 0 && this.diry != 0) {
              if(this.canMovex)
                  this.x += this.dirx * 
                  (this.speed / (Math.sqrt(Math.pow(this.speed, 2) + 
                  Math.pow(this.speed, 2)))) * this.speed;
              if(this.canMovey)
                  this.y += this.diry * 
                  (this.speed / (Math.sqrt(Math.pow(this.speed, 2) + 
                  Math.pow(this.speed, 2)))) * this.speed;
          }
          // not diagonal
          else {
              if(this.canMovex)
                  this.x += this.dirx * this.speed;
              if(this.canMovey)
                  this.y += this.diry * this.speed;
          }
      }
      // else {
      //     if(this.canMovex)
      //         this.x += joystickData.movex;
      //     if(this.canMovey)
      //         this.y += joystickData.movey;
      // }

      // if player ever gets outside of the screen, move player back in
      if(this.x < margin)
          this.x = margin * 2;
      if(this.x > w - margin)
          this.x = w - (margin * 2);
      if(this.y < margin)
          this.y = margin * 2;
      if(this.y > h - margin)
          this.y = h - (margin * 2);
  }
};

function Potato() {
  this.x = 0,
  this.y = 0,
  this.dir = 1,
  this.size = 60,
  this.yOffset = 30,
  this.player = -1,
  this.attached = false,
  this.threw = false,
  this.canBeThrown = true,
  this.throwx = 1,
  this.throwFrame = 0,
  this.maxThrowFrame = 5,
  this.throwSpeed = 150,
  this.mouseThrowx = 0,// the mouse x position when clicked to throw
  this.mouseThrowy = 0,// the mouse y position when clicked to throw
  this.throwMovex = 0,// how much to move each frame on x axis during throw
  this.throwMovey = 0,// how much to move each frame on y axis during throw
  this.movement = function() {
      // when attached to a player
      if(this.attached) {
          this.dir = players[this.player].lastx;
          this.x = players[this.player].x + ((this.dir == -1) ? -25 : 25);
          this.y = players[this.player].y + 35;

          // possibly check for pass to other player here
      }
      // when throw missed and on the ground only allow
      // player who throw potato to pick it back up
      else if (this.canBeThrown){ 
          if(inCollision(this.x, this.y, 
          players[this.player].x, players[this.player].y)) {
              this.attached = true;
          }
      }

      // throw
      if(this.threw) {
          // set initial throw data stuff
          if(this.throwFrame == 0) {
              this.attached = false;
              this.canBeThrown = false;

              this.mouseThrowx = lastMousex;
              this.mouseThrowy = lastMousey;

              let distx = Math.abs(this.x - this.mouseThrowx);
              let disty = Math.abs(this.y - this.mouseThrowy);

              let theta = Math.atan(disty / distx);

              this.throwMovex = (Math.cos(theta) * this.throwSpeed);
              this.throwMovey = (Math.sin(theta) * this.throwSpeed);

              //the remainder of the stuff to set the correct throwMovex and 
              // throw throwMovey is probably not the best way of doing it
              // but I'm dumb and don't know how else to do it
              // positive/ negative only wors when player is above and to the
              // left of the mouse, so this correctly sets it
              if(this.mouseThrowx < this.x)
                  this.throwMovex *= -1;
              if(this.mouseThrowy < this.y)
                  this.throwMovey *= -1;
          }

          // actually move potato when being thrown
          this.x += this.throwMovex;
          this.y += this.throwMovey;

          // check for pass to other player here
          for(let i = 0; i < players.length; i++) {
              if(players[i].id != id) {
                  if(inCollision(this.x, this.y, 
                  players[i].x, players[i].y)) {
                      this.player = i;
                      this.attached = true;
                      this.threw = false;
                      this.canBeThrown = true;// for if client
                      // gets potato again they will be able to
                      // throw it
                      recentlyPassed = true;
                  }
              }
          }

          ++this.throwFrame;
          if(this.throwFrame >= this.maxThrowFrame) {
              this.throwFrame = 0;
              this.threw = false;
              this.canBeThrown = true;
          }
      }

      // if potato ever gets outside of the screen, move potato back in
      if(this.x < 0)
          this.x = 0;
      if(this.x > w)
          this.x = w;
      if(this.y < 0)
          this.y = 0;
      if(this.y > h)
          this.y = h;
  }
};

let users = [];// 
let potatos = ["potato"];// contains data for the potato for each game
let intervals = ["interval"];
let overs = ["over"];// if the game is over
let gameFrames = ["game frame"];// what frame each game is on
let maxGameFrames = ["max game frame"];// what max frame for each game is
let uis = ["ui"];// contains objects that hold data and functions for ui stuff
let lobbies = [[]];// contains data for each client
let lobbiesInGame = [];// which lobbies are in the game
let maxPlayersPerLobby = 4;
let startWait = 500;
let fps = 30;
let gameLengthPerPlayer = 10;// in seconds
let loopWait = Math.round(1000 / fps);// how many milliseconds are between each call of the main game loop
let maxDashWaitFrame = fps * 5;

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
    if(lobbyRemovePos > 0) {
      removeFromLobby(id);
    }
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
      /* MAKE WORK
      io.to(lobbyRemovePos.toString()).emit("cancel game");
      */

      // remove lobby from lobbiesInGame
      for(let i = 0; i < lobbiesInGame.length; i++) {
        if(lobbiesInGame[i] == lobbyRemovePos) {
          lobbiesInGame.splice(i, 1);
          potatos.splice(i, 1);
          intervals.splice(i, 1);
          overs.splice(i, 1);
          uis.splice(i, 1);
          gameFrames.splice(i, 1);
          maxGameFrames.splice(i, 1);
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
      potatos.push(new Potato);
      let interval;
      intervals.push(interval);
      overs.push(false);
      gameFrames.push(0);
      maxGameFrames.push(lobbies[lobby].length * fps * gameLengthPerPlayer);
      uis.push();

      io.to(lobby.toString()).emit("game started", gameMapData(lobby));

      setTimeout(() => {
        intervals[lobby] = setInterval(gameLoop, loopWait, lobby);
      }, startWait);
    }
  });

  socket.on("next round", (lobby) => {
    // FINISH
    // reset stuff here
    lobbiesInGame.push(lobby);
    potatos.push(new Potato);
    clearInterval(intervals[lobby]);
    overs[lobby] = false;
    gameFrames[lobby] = 0;
    maxGameFrames[lobby] = lobbies[lobby].length * fps * gameLengthPerPlayer;

    io.to(lobby.toString()).emit("game started", gameMapData(lobby));

    setTimeout(() => {
      intervals[lobby] = setInterval(gameLoop, loopWait, lobby);
    }, startWait);
  });

  // client letting server know a key/ input was pressed
  socket.on("player pressed", (pressed, lobby, index) => {
      if(pressed == "left") {
        lobbies[lobby][index].dirx = -1;
      }

      if((pressed == "right") && !overs[lobby]) {
          lobbies[lobby][index].dirx = 1;
      }

      if((pressed == "up") && !overs[lobby]) {
          lobbies[lobby][index].diry = -1;
          lobbies[lobby][index].lastDir = 6;
      }

      if((pressed == "down") && !overs[lobby]) {
          lobbies[lobby][index].diry = 1;
          lobbies[lobby][index].lastDir = 2;
      }

      // only allow dash if moving
      // and don't have to check to see if the game is still running
      // because function doesn't change player last dir or lastx
      if((pressed == "dash") && lobbies[lobby][index].canDash && 
      (lobbies[lobby][index].dirx != 0 || lobbies[lobby][index].diry != 0)) {
          lobbies[lobby][index].dashDirx = lobbies[lobby][index].dirx;
          lobbies[lobby][index].dashDiry = lobbies[lobby][index].diry;
          lobbies[lobby][index].dashPressed = true;
      }
      // if player moving diagonally, set last dir to be diagonal
      if((lobbies[lobby][index].dirx != 0 && lobbies[lobby][index].diry != 0) && !overs[lobby]) {
          if(lobbies[lobby][index].dirx == 1) {
              if(lobbies[lobby][index].diry == 1)
                  lobbies[lobby][index].lastDir = 1;
              else
                  lobbies[lobby][index].lastDir = 7;
          }
          else {
              if(lobbies[lobby][index].diry == 1)
                  lobbies[lobby][index].lastDir = 3;
              else
                  lobbies[lobby][index].lastDir = 5;
          }
      }
  });

  // client letting server know a key/ input was pressed
  socket.on("player released", (released, lobby, index) => {
      if((released == "left") && lobbies[lobby][index].dirx == -1) {
          lobbies[lobby][index].dirx = 0;
      }

      if((released == "right") && lobbies[lobby][index].dirx == 1) {
          lobbies[lobby][index].dirx = 0;
      }

      if((released == "up") && lobbies[lobby][index].diry == -1) {
          lobbies[lobby][index].diry = 0;
      }

      if((released == "down") && lobbies[lobby][index].diry == 1) {
          lobbies[lobby][index].diry = 0;
      }
  });
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
function gameMapData(lobby) {
    // set skins of each client
    for(let i = 0; i < lobbies[lobby].length; i++) {
        lobbies[lobby][i].skin = i;
    }


    let data = {
        maxGameFrame: maxGameFrames[lobby],
        maxDashWaitFrame: maxDashWaitFrame,
        map: {
            size: mapSize,
            data: []
        },
        canvas: {
            w: w,
            h: h,
        },
        startWait: startWait,
        clients: lobbies[lobby]
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
        if(i == 0) {
          lobbies[lobby][0].x = Math.floor((Math.random() * (data.canvas.w - border)) + 
            border);
          lobbies[lobby][0].y = Math.floor((Math.random() * (data.canvas.h - border)) + 
            border);
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
                for(let j = 0; j < lobbies[lobby].length; j++) {
                    if(touching(x, y, 
                    lobbies[lobby][j].x, 
                    lobbies[lobby][j].y))
                        generateAgain = true;
                }
            }

            lobbies[lobby][0].x = x;
            lobbies[lobby][0].y = y;
        }
    }

    // set who starts with the potato
    potatos[lobby].player = Math.floor(Math.random() * lobbies[lobby].length);
    // set position of potato to position of the player who has it
    potatos[lobby].x = lobbies[lobby][potatos[lobby].player].x;
    potatos[lobby].y = lobbies[lobby][potatos[lobby].player].y;

    return data;
}

// object for holding data to send to each client to render a player
function RenderPlayer() {
  this.x = w + 10, 
  this.y = h + 10, 
  this.width = -1, 
  this.height = -1, 
  this.maxSkins = -1,
  this.animationFrame = -1,
  this.dashWaitFrame = -1,
  this.inDash = false,
  this.dashFrame = -1
}

function gameLoop(lobby) {
  // process stuff
  
  ++gameFrames[lobby];

  // player movement (including dash)
  for(let i = 0; i < lobbies[lobby].length; i++) {
    lobbies[lobby][i].processInput();
  }

  // render stuff

  let renderData = {
    gameFrame: gameFrames[lobby],
    players: [],
    potato: {
      x: potatos[lobby].x, 
      y: potatos[lobby].y, 
      dir: potatos[lobby].dir, 
      size: potatos[lobby].size, 
      yOffset: potatos[lobby].yOffset
    }
  }
  
  for(let i = 0; i < lobbies[lobby].length; i++) {
    renderData.players.push(new RenderPlayer());

    renderData.players[i].x = lobbies[lobby][i].x;
    renderData.players[i].y = lobbies[lobby][i].y;
    renderData.players[i].width = lobbies[lobby][i].width;
    renderData.players[i].height = lobbies[lobby][i].height;
    renderData.players[i].maxSkins = lobbies[lobby][i].maxSkins;
    renderData.players[i].animationFrame = lobbies[lobby][i].animationFrame;
    renderData.players[i].dashWaitFrame = lobbies[lobby][i].dashWaitFrame;
    renderData.players[i].inDash = lobbies[lobby][i].dashPressed;
    renderData.players[i].dashFrame = lobbies[lobby][i].dashFrame;
  }

  io.to(lobby.toString()).emit("server sending render data", (renderData));

  if(gameFrames[lobby] == maxGameFrames[lobby]) {
    console.log("game over");

    clearInterval(intervals[lobby]);
  }
}