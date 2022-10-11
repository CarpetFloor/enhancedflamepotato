//-- menu stuff --\\

// note that id is actual string id of client
// and clientId is index in players array that client is
let socket = io();
let id = -1;
let index = -1;
/*for some reason no matter what room c1ient0 is in, they
still get stuff from the first room*/            
let lobby = 0;
// when connected to the server, set id
socket.on("connected", ()=> {
    if(lobby < 1 && id == -1) {
        id = socket.id;
        console.log(id);
    }
});

function showLobby() {
    document.getElementById("mainMenu").style.visibility = "hidden";
    document.getElementById("menuSubText").style.visibility = 
    "hidden";
    document.getElementById("join").style.visibility = "hidden";
    document.getElementById("lobby").style.visibility = "visible";
}

function createLobby() {
    showLobby()
    socket.emit("create lobby", id);
}

function joinLobbyMenu() {
    document.getElementById("mainMenu").style.visibility = "hidden";
    document.getElementById("menuSubText").style.visibility = 
    "hidden";
    document.getElementById("join").style.visibility = "visible";
}

function joinLobby() {
    let lobby = parseInt(document.getElementById("joinInput").value);
    socket.emit("join lobby", id, lobby)

    // clear value entered in input after joining a lobby
    document.getElementById("joinInput").value = "";
}

// successfully joined lobby, so change menu to lobby meny
socket.on("joined lobby", () => {
    document.getElementById("mainMenu").style.visibility = "visible";
    document.getElementById("settings").style.visibility = "hidden";
    document.getElementById("join").style.visibility = "hidden";
    document.getElementById("lobby").style.visibility = "hidden";
    showLobby();
});

// get the updated list of players in current lobby
socket.on("set lobby names", (players, currentLobby) => {
    // I have no idea why
    if(currentLobby > 0) {
        lobby = currentLobby;
        // set correct current game mode in lobby menu
        document.getElementById("gameId").innerHTML = "GameID: " + 
        currentLobby;
        // set correct c1ient name in lobby menu
        document.getElementById("youName").innerHTML = id;

        // clear current player names
        let parent = document.getElementById("lobbyPlayers");
        while(parent.hasChildNodes()) {
            parent.removeChild(parent.children[0]);
        }

        // add player names to screen as html p elements
        for(let i = 0; i < players.length; i++) {
            let p = document.createElement("p");
            let text = document.createTextNode(players[i]);
            p.classList.add("playerList");
            p.appendChild(text);

            parent.appendChild(p);
        }
    }
});

function settings() {
    document.getElementById("mainMenu").style.visibility = "hidden";
    document.getElementById("menuSubText").style.visibility = 
    "hidden";
    document.getElementById("settings").style.visibility = "visible";
}

function backToMainMenu() {
    mapR.clearRect(0, 0, w, h);
    r.clearRect(0, 0, w, h);
    dashEffectR0.clearRect(0, 0, w, h);
    dashEffectR1.clearRect(0, 0, w, h);
    dashEffectR2.clearRect(0, 0, w, h);
    dashEffectR3.clearRect(0, 0, w, h);

    document.getElementById("mainMenu").style.visibility = "visible";
    document.getElementById("menuSubText").style.visibility = 
    "visible";
    document.getElementById("settings").style.visibility = "hidden";
    document.getElementById("join").style.visibility = "hidden";
    document.getElementById("lobby").style.visibility = "hidden";
    document.getElementById("gameOverText").style.visibility = "hidden";

    socket.emit("go back to main lobby", id, lobby);
    lobby = 0;
}

function tryToStartGame() {
    socket.emit("start game attempt", lobby);
}

//-- actual game stuff, but only input detection and rendering --\\
let mapC = document.getElementById("mapCanvas")
let mapR = mapC.getContext("2d");
let c = document.getElementById("mainCanvas");
let r = c.getContext("2d");
// with more players dash stuff here
let dashEffectC0 = document.getElementById("dashEffect0");
let dashEffectC1 = document.getElementById("dashEffect1");
let dashEffectC2 = document.getElementById("dashEffect2");
let dashEffectC3 = document.getElementById("dashEffect3");
let dashEffectR0 = dashEffectC0.getContext("2d");
let dashEffectR1 = dashEffectC1.getContext("2d");
let dashEffectR2 = dashEffectC2.getContext("2d");
let dashEffectR3 = dashEffectC3.getContext("2d");
let w = -1;
let h = -1;
let playerColors = ["yellow", "lime", "cornflowerBlue", "red"];
let playerNames = ["yellow", "green", "blue", "red"];
let maxGameFrame = -1;
let maxDashWaitFrame = -1;

let ui = { 
    width: 112,
    height: 112,
    rows: 6,
    cols: 8,
    frame: -1,
    transparency: 0.8,
    img: new Image(),// spritesheet for all skills
    loadImage: function() {
        this.img.src = "Assets/Skills.png";
    },
    // structure:
    // object with render info if the object does not have an image
    // function to render object
    dash: {
        x: 20,
        y: -1
    },
    showDash: function() {
        this.frame = 16;

        //border
        r.globalAlpha = this.transparency;
        r.fillStyle = "black";
        r.fillRect(this.dash.x, this.dash.y, this.width, this.height);

        // icon
        r.drawImage(
            this.img,
            (Math.floor(this.frame / this.cols) +
            (this.frame % this.cols -
            Math.floor(this.frame / this.cols))) * this.width, 
            (Math.floor(this.frame / this.cols)) * this.height,
            this.width,
            this.height,
            this.dash.x,
            this.dash.y,
            this.width,
            this.height);
        
        // overlay to show time remaining until usable
        r.globalAlpha = this.transparency - 0.2;
        r.fillRect(this.dash.x, this.dash.y, 
            (players[clientId].maxDashWaitFrame - players[clientId].dashWaitFrame) * 
            (this.width / players[clientId].maxDashWaitFrame),
            this.height);
        r.globalAlpha = 1;
    },
    potato: {
        // no x becasue it is centered on screen based off of width
        y: 30,
        width: -1,
        height: 70,
        border: 15,// how much on x and y axes the border extends in pixels
        bgcolor: "#641E16",
        color: "#CD6155"
    },
    showPotato: function() {
        let borderx = (w / 2) - ((this.potato.width + this.potato.border) / 2);
        let x = (w / 2) - (this.potato.width / 2);
        
        // border
        r.globalAlpha = this.transparency;
        r.fillStyle = "black";
        r.fillRect(borderx,
            this.potato.y - (this.potato.border / 2),
            this.potato.width + this.potato.border,
            this.potato.height + this.potato.border);

        // remaining time
        r.fillStyle = this.potato.bgcolor;
        r.fillRect(x, this.potato.y, this.potato.width, this.potato.height);

        // elapsed time
        r.fillStyle = this.potato.color;
        r.fillRect(x, this.potato.y, 
        (potatoFrame / maxPotatoFrame) * this.potato.width,
        this.potato.height);
        r.globalAlpha = 1;
    }
}; ui.loadImage();

let map = {
    img: new Image(),
    size: -1,
    frame: 0,
    rows: 3,
    cols: 9,
    mapData: [],
    loadImage: function() {
        map.img.src = "Assets/Map.png";
    },
    show: function() {
        // for some reason this dot doesn't work and everything is not defined
        for(let y = 0; y < map.mapData.length; y++) {
            for(let x = 0; x < map.mapData[y].length; x++) {
                map.frame = map.mapData[y][x];

                mapR.drawImage(
                    map.img,
                    (Math.floor(map.frame / map.cols) +
                    (map.frame % map.cols -
                    Math.floor(map.frame / map.cols))) * map.size, 
                    (Math.floor(map.frame / map.cols)) * map.size,
                    map.size,
                    map.size,
                    x * map.size,
                    y * map.size,
                    map.size,
                    map.size);
            }
        }

        // hide "game loading..." text
        document.getElementById("noticeText").style.visibility = "hidden";
        mapLoaded = true;
        
        startGame();
    }
}; map.loadImage();

let explosion = {
    img: new Image(),
    width: 153,
    height: 153,
    frame: 0,
    rows: 4,
    cols: 3,
    loadImage: function() {
        this.img.src = "Assets/Explosion.png";
    },
    show: function() {
        r.clearRect(0, 0, w, h);
        
        if(potato.player != clientId)
            players[clientId].show();
        showOtherPlayers();

        // for some reason this dot doesn't work for this 
        r.drawImage(
            explosion.img,// image
            // clipping x start
            (Math.floor(explosion.frame / explosion.cols) + 
            (explosion.frame % explosion.cols -
            Math.floor(explosion.frame / explosion.cols))) * explosion.width,
            // clipping y start 
            (Math.floor(explosion.frame / explosion.cols)) * explosion.height,
            explosion.width,// width of clipping
            explosion.height,// height of clipping
            /*for some reason, using potato.x and potato.y cause
            the potato to go to where it was on the ground from
            a missed throw if that happened, and not to the player*/
            (players[potato.player].x + 
            ((players[potato.player].lastx == -1) ? -25 : 25))
                - 60, // x pos
                players[potato.player].y + 35 - 65, // y pos, and I don't know why the
            // x and y offsets work
            explosion.width,// width of image
            explosion.height// height of image
        );

        ++explosion.frame;
        
        // if not done with animation, call function again
        if(explosion.frame < explosion.rows * explosion.cols)
            window.setTimeout(explosion.show, 1000 / (fps / 2.2));
        // the last frame of animation still shows something
        // so after animation is over, remove explosion
        else {
            r.clearRect(0, 0, w, h);

            if(players.length == 2) {
                document.getElementById("gameOverText").innerHTML = 
                "You Win!";
            }
            else {
                document.getElementById("gameOverText").innerHTML = 
                "You Survived!";
            }
            // don't show exploded player
            if(potato.player != clientId)
                players[clientId].show();
            // function will make sure to not show exploded player
            else {
                if(mobile) {
                    document.getElementById("gameOverText").innerHTML = 
                    "You Got<br>Potato'd!";
                }
                else {
                    document.getElementById("gameOverText").innerHTML = 
                    "You Got Potato'd!";
                }
                showOtherPlayers();
            }
            
            // player lost text
            // css because custom font face with canvas would not work
            // nevermind, got it to work, but I don't want to change this
            // because it already works, and I think this is easier
            document.getElementById("gameOverText").style.visibility = "visible";

            let wait0 = 5;
            let wait1 = 2;
            // remove exploded player
            if(potato.player == clientId) {
                window.setTimeout(() => {
                    document.getElementById("gameOverText").innerHTML = 
                    "Leaving Game";

                    window.setTimeout(() => {
                        backToMainMenu();
                    }, 1000 * wait1);
                }, 1000 * wait0);
            }
            else {
                // start next round
                // arrow functions coming in clutch!
                window.setTimeout(() => {
                    if(players.length == 2) {
                        document.getElementById("gameOverText").innerHTML = 
                        "Leaving Game";

                        window.setTimeout(() => {
                            backToMainMenu();
                        }, 1000 * wait1);
                    }
                    else {
                        document.getElementById("gameOverText").innerHTML = 
                        "Starting Next Round";

                        window.setTimeout(() => {
                            // only have lowest-index client request
                            // to start a new game
                            /*lowest-index player will be 0, unless
                            that player exploded, otherwise lowest
                            will be 1. So only have to check those
                            two players*/
                            for(let i = 0; i < 2; i++) {
                                if(i != potato.player &&
                                i == clientId) {
                                    socket.emit("next round", lobby);
                                    break;
                                }
                            }
                        // wait a bit longer to give time for
                        // the exploded player to leave current lobby
                        // so that they will not receive the socket
                        // signal that a new game has started
                        }, 1000 * (wait1 + 1));
                    }
                }, 1000 * wait0)
            }
        }
    }
}; explosion.loadImage();

socket.on("game started", (init) => {
    console.log(init);

    // set index for when sending data to server server will know who is sending stuff
    for(let i = 0; i < init.clients.length; i++) {
        if(init.clients[i].id == id)
            index = i;
    }

    maxGameFrame = init.maxGameFrame;
    maxDashWaitFrame = init.maxDashWaitFrame;

    document.getElementById("gameOverText").style.visibility = "hidden";
    document.getElementById("lobby").style.visibility = "hidden";
    document.getElementById("menuSubText").style.visibility = "hidden";
    document.getElementById("noticeText").style.visibility = "visible";
    
    // for some reason after the game ends and client is sent back to the main
    // menu, the mobile controls images show up
    if(!mobile) {
        document.getElementById("mobileDashImg").style.visibility = "hidden";
        document.getElementById("joystickContainer").style.visibility = "hidden";
    }

    mapR.clearRect(0, 0, w, h);
    r.clearRect(0, 0, w, h);
    dashEffectR0.clearRect(0, 0, w, h);
    dashEffectR1.clearRect(0, 0, w, h);
    dashEffectR2.clearRect(0, 0, w, h);
    dashEffectR3.clearRect(0, 0, w, h);

    // set up all the game data

    w = init.canvas.w;
    h = init.canvas.h;
    mapC.width = w;
    mapC.height = h;
    c.width = w;
    c.height = h;
    // with more players dash stuff here
    dashEffectC0.width = w;
    dashEffectC1.width = w;
    dashEffectC2.width = w;
    dashEffectC3.width = w;
    dashEffectC0.height = h;
    dashEffectC1.height = h;
    dashEffectC2.height = h;
    dashEffectC3.height = h;

    map.size = init.map.size; 
    map.mapData = init.map.data;

    uiData.time.width = w / 2;
    uiData.dash.y = h - 130;

    explosion.frame = 0;

    // with more players dash stuff here
    dashEffectR0.globalAlpha = 0.25;
    dashEffectR0.strokeStyle = "white";
    dashEffectR0.lineWidth = 80;
    dashEffectR1.globalAlpha = 0.25;
    dashEffectR1.strokeStyle = "white";
    dashEffectR1.lineWidth = 80;
    dashEffectR2.globalAlpha = 0.25;
    dashEffectR2.strokeStyle = "white";
    dashEffectR2.lineWidth = 80;
    dashEffectR3.globalAlpha = 0.25;
    dashEffectR3.strokeStyle = "white";
    dashEffectR3.lineWidth = 80;

    window.setTimeout(map.show, init.startWait);// for some reason, map.show is not able
    // to draw anything unless it is called from a window.setTimeout()
});

// add event listeners
// function called at end of map.show(), which is called at end of "game started" socket.on
function startGame() {
    // key pressed
    if(!mobile)
        document.addEventListener("keydown", press);
    else {
        /* only have to add event listeners for dash because joystick
        event listeners are already dealt with in joy.js and joystick
        data is obtained from interval joystickInterval*/
        joystickInterval = window.setInterval(() => {
            joystickData.x = joystick.GetX();
            joystickData.y = joystick.GetY();
            mobileMove();
            // have to call function this often otherwise movement is jittery
        }, Math.ceil(timeUntilNextFrame / 2));

        document.getElementById("mobileButtonsDash").addEventListener(
            "touchstart", mobileDash);

        document.getElementById("mobileButtonsDash").addEventListener(
            "touchmove", mobileDash);
    }

    // key released
    if(!mobile)
        document.addEventListener("keyup", release);

    // set the player and potato direction based off of the mouse
    // if(!mobile)
    //     document.addEventListener("mousemove", mouseMoved);
    
    // detect click or tap for throwing the potato
    // if(!mobile)
    //     document.getElementById("mainCanvas").addEventListener("mousedown", mouseDown);
    // else
    //     document.getElementById("mainCanvas").addEventListener("touchstart", touched);

    // show mobile controls
    if(mobile) {
        document.getElementById("mobileDashImg").style.visibility = "visible";
        document.getElementById("joystickContainer").style.visibility = "visible";
    }
}

/*
non mobile
key pressed
*/
function press(e) {
    if(e.keyCode == "65" || e.keyCode == "37")
        socket.emit("player pressed", "left", lobby, index);

    if(e.keyCode == "68" || e.keyCode == "39")
        socket.emit("player pressed", "right", lobby, index);

    if(e.keyCode == "87" || e.keyCode == "38")
        socket.emit("player pressed", "up", lobby, index);
        
    if(e.keyCode == "83" || e.keyCode == "40")
        socket.emit("player pressed", "down", lobby, index);

    if(e.keyCode == "32" && players[clientId].canDash)
        socket.emit("player pressed", "dash", lobby, index);
}

/*
non mobile
key released
*/
function release(e) {
    if(e.keyCode == "65" || e.keyCode == "37")
        socket.emit("player released", "left", lobby, index);

    if(e.keyCode == "68" || e.keyCode == "39")
        socket.emit("player released", "right", lobby, index);

    if(e.keyCode == "87" || e.keyCode == "38")
        socket.emit("player released", "up", lobby, index);

    if(e.keyCode == "83" || e.keyCode == "40")
        socket.emit("player released", "down", lobby, index);
}

let playerImg = new Image();
playerImg.src = "Assets/Players.png";
let potatoImg = new Image();
potatoImg.src = "Assets/Potato.png";
let uiData = {
    general: {
        width: 112,
        height: 112,
        rows: 6,
        cols: 8,
        transparency: 0.8,
    },
    time: {
        // no x becasue it is centered on screen based off of width
        y: 30,
        width: -1,
        height: 70,
        border: 15,// how much on x and y axes the border extends in pixels
        bgcolor: "#641E16",
        color: "#CD6155"
    },
    dash: {
        x: 20,
        y: -1,
        frame: 16,
    }
}
// object in case more stuff is added later on
let uiImgs = {
    dash: new Image()
}
uiImgs.dash.src = "Assets/Skills.png";

socket.on("server sending render data", (data) => {
    console.log("data received from server");
    console.log(data);
    console.log("here");
    console.log(index);
    console.log(data.players);
    console.log(data.players[1]);
    console.log(data.players[index]);
    console.log("finally");
    console.log(data.players[index].dashWaitFrame);

    r.clearRect(0, 0, w, h);

    // players
    for(let i = 0; i < data.players.length; i++) {
        showPlayer(data.players[i], i);
    }

    // potato
    // offset different than from source code
    r.drawImage(
        potatoImg, // img
        (data.potato.dir == 1) ? 0 : data.potato.size, // clip x start
        0, // clip y start
        data.potato.size, // clip x end
        data.potato.size, // clip y end
        data.potato.x - ((data.potato.dir == -1) ? data.potato.size : 0), // x
        data.potato.y, // y
        data.potato.size, // width 
        data.potato.size); // height
    
    // ui time left
    showUiTime(data.gameFrame);

    // ui dash
    showUiDash(data.players[index].dashWaitFrame);
});

function showPlayer(player, playerIndex) {
    let clipx = player.width * playerIndex;

    if(player.lastx == -1) {
        let move = player.maxSkins - playerIndex;
        clipx += (move + (move - 1)) * player.width;
    }
    
    r.drawImage(
        playerImg,// image
        clipx,// cliiping x start
        player.animationFrame * player.height,// clipping y start
        player.width,// width of clipping
        player.height,// height of clipping
        player.x - (player.width / 2),
        player.y - (player.height / 2),
        player.width,// width of image
        player.height// height of image
    );
}

function showUiTime(frame) {
    let borderx = (w / 2) - ((uiData.time.width + uiData.time.border) / 2);
    let x = (w / 2) - (uiData.time.width / 2);
    
    // border
    r.globalAlpha = uiData.general.transparency;
    r.fillStyle = "black";
    r.fillRect(borderx,
        uiData.time.y - (uiData.time.border / 2),
        uiData.time.width + uiData.time.border,
        uiData.time.height + uiData.time.border);

    // remaining time
    r.fillStyle = uiData.time.bgcolor;
    r.fillRect(x, uiData.time.y, uiData.time.width, uiData.time.height);

    // elapsed time
    r.fillStyle = uiData.time.color;
    r.fillRect(x, uiData.time.y, 
    (frame / maxGameFrame) * uiData.time.width,
    uiData.time.height);
    r.globalAlpha = 1;
}

function showUiDash(frame) {
    console.log("please work");
    console.log("frame " + frame);
    console.log("max frame " + maxDashWaitFrame);

    //border
    r.globalAlpha = uiData.general.transparency;
    r.fillStyle = "black";
    r.fillRect(uiData.dash.x, uiData.dash.y, uiData.general.width, uiData.general.height);

    // icon
    r.drawImage(
        uiImgs.dash,
        (Math.floor(uiData.dash.frame / uiData.general.cols) +
        (uiData.dash.frame % uiData.general.cols -
        Math.floor(uiData.dash.frame / uiData.general.cols))) * uiData.general.width, 
        (Math.floor(uiData.dash.frame / uiData.general.cols)) * uiData.general.height,
        uiData.general.width,
        uiData.general.height,
        uiData.dash.x,
        uiData.dash.y,
        uiData.general.width,
        uiData.general.height);

    console.log("icon data");
    console.log(uiImgs.dash);
    console.log((Math.floor(uiData.general.frame / uiData.general.cols) +
    (uiData.general.frame % uiData.general.cols -
    Math.floor(uiData.general.frame / uiData.general.cols))) * uiData.general.width);
    console.log((Math.floor(uiData.general.frame / uiData.general.cols)) * uiData.general.height);
    console.log(uiData.general.width);
    console.log(uiData.general.height);
    console.log(uiData.dash.x);
    console.log(uiData.dash.y);
    console.log(uiData.general.width);
    console.log(uiData.general.height);
    
    // overlay to show time remaining until usable
    r.globalAlpha = uiData.general.transparency - 0.2;
    r.fillRect(uiData.dash.x, uiData.dash.y, 
        (maxDashWaitFrame - frame) * 
        (uiData.general.width / maxDashWaitFrame),
        uiData.general.height);
    r.globalAlpha = 1;
}