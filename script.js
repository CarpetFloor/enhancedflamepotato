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
        document.getElementById("youName").innerHTML = players[index];

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
    dashEffectR.clearRect(0, 0, w, h);

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
let dashEffectC = document.getElementById("dashEffect");
let dashEffectR = dashEffectC.getContext("2d");
let w = -1;
let h = -1;
let maxGameFrame = -1;
let maxDashWaitFrame = -1;
let previousInDash = false;
// for dash effect
let previousPos = {
    x: "x",
    y: "y"
}
let x = "x";
let lastx = "x";
let potatoPlayer = -1;
let playersRenderData;
let potatoRenderData;
let fps = -1;

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
    dashEffectR.clearRect(0, 0, w, h);

    // set up all the game data

    w = init.canvas.w;
    h = init.canvas.h;
    mapC.width = w;
    mapC.height = h;
    c.width = w;
    c.height = h;
    // with more players dash stuff here
    dashEffectC.width = w;
    dashEffectC.height = h;

    map.size = init.map.size; 
    map.mapData = init.map.data;

    uiData.time.width = w / 2;
    uiData.dash.y = h - 130;

    explosion.frame = 0;

    // with more players dash stuff here
    dashEffectR.globalAlpha = 0.25;
    dashEffectR.strokeStyle = "white";
    dashEffectR.lineWidth = 80;

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
    if(!mobile)
        document.addEventListener("mousemove", mouseMoved);
    
    // detect click or tap for throwing the potato
    if(!mobile)
        document.getElementById("mainCanvas").addEventListener("mousedown", mouseDown);
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

    if(e.keyCode == "32")
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

/*
non mobile
mouse moved
*/
function mouseMoved(e) {
    // whoever thought that getting the position of the mouse would be this hard
    let bounds = c.getBoundingClientRect();
    let lastMousex = e.pageX - bounds.left - scrollX;
    let lastMousey = e.pageY - bounds.top - scrollY;

    lastMousex /= bounds.width; 
    lastMousey /= bounds.height;

    lastMousex *= w;
    lastMousey *= h;
    
    if((x > lastMousex) && (lastx != -1)) {
        lastx = -1;// set last x here so that in case the mouse moves multiple
        /* times before the next game frame happens, this won't happen multiple times*/
        socket.emit("player setting lastx", -1, lobby, index);
    }
    else if((x < lastMousex) && (lastx != 1)) {
        lastx = 1;// set last x here so that in case the mouse moves multiple
        /* times before the next game frame happens, this won't happen multiple times*/
        socket.emit("player setting lastx", 1, lobby, index);
    }
};

/*
non mobile
mouse clicked
*/
function mouseDown(e) {
    // only able to tell server that client is trying to throw potato when
    // client has the potato, also this reduces the need for the server to
    // have to check if the client has the potato
    if(potatoPlayer == index) {
        let bounds = c.getBoundingClientRect();
        let lastMousex = e.pageX - bounds.left - scrollX;
        let lastMousey = e.pageY - bounds.top - scrollY;

        lastMousex /= bounds.width; 
        lastMousey /= bounds.height;

        lastMousex *= w;
        lastMousey *= h;

        socket.emit("player throwing potato", lastMousex, lastMousey, lobby);
    }
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
    r.clearRect(0, 0, w, h);

    playersRenderData = data.players;// for game over
    fps = data.fps;

    // render other players first
    for(let i = 0; i < data.players.length; i++) {
        if(i != index)
            showPlayer(data.players[i], i);
    }

    //then render client so that client is always rendered on top
    x = data.players[index].x;
    lastx = data.players[index].lastx;
    showPlayer(data.players[index], index);

    // potato
    showPotato(data.potato);
    potatoRenderData = data.potato;// for game over    
    potatoPlayer = data.potato.player;
    
    // ui time left
    showUiTime(data.gameFrame);

    // ui dash
    showUiDash(data.players[index].dashWaitFrame);
});

function showPlayer(player, playerIndex) {
    // dash effect, but only for client
    if(playerIndex == index) {
        if(player.inDash) {
            if(player.dashFrame == 1) {
                dashEffectR.beginPath();
                dashEffectR.moveTo(player.x, player.y);
                dashEffectR.lineTo(player.x, player.y);
            }
            else {
                dashEffectR.lineTo(player.x, player.y);
                dashEffectR.stroke();
            }
        }

        // clear dash effect right after dash ends
        if(!player.inDash && previousInDash)
            dashEffectR.clearRect(0, 0, w, h);

        previousInDash = player.inDash;
    }

    // player
    let clipx = player.width * playerIndex;

    if(player.lastx == -1) {
        let move = player.maxSkins - playerIndex;
        clipx += (move + (move - 1)) * player.width;
    }
 
    // player
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

    // name tag
    r.globalAlpha = uiData.transparency;
    r.fillStyle = "black"

    let nameText = "You";

    if(playerIndex == index)
        nameText = player.name;

    let width = 16 * nameText.length;
    let height = 25;

    // background
    r.fillRect(
        player.x - (width / 2), 
        player.y - (player.height / 2) - (height / 2) - 18,
        width,
        height);

    r.font = "30px VT323";
    // make client name tag a different color
    if(playerIndex == index)
        r.fillStyle = "#EC407A";
    else
        r.fillStyle = "white";

    r.fillText(
        nameText, 
        player.x - (width / 2) + 5, 
        player.y - (player.height / 2) - (height / 2) + 2);
    console.log("b");

    r.globalAlpha = 1;
}

function showPotato(data) {
    r.drawImage(
        potatoImg, // img
        (data.dir == 1) ? 0 : data.size, // clip x start
        0, // clip y start
        data.size, // clip x end
        data.size, // clip y end
        data.x - (data.size / 2), // x
        data.y - data.yOffset, // y
        data.size, // width
        data.size); // height
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
    //border
    r.globalAlpha = uiData.general.transparency;
    // visual indicator when dash is ready
    if(frame == maxDashWaitFrame)
        r.fillStyle = "#F5B041";
    else
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

    // overlay to show time remaining until usable
    r.globalAlpha = uiData.general.transparency - 0.2;
    r.fillRect(uiData.dash.x, uiData.dash.y, 
        (maxDashWaitFrame - frame) * 
        (uiData.general.width / maxDashWaitFrame),
        uiData.general.height);
    r.globalAlpha = 1;
}

function removeListeners() {
    if(!mobile) {
        document.removeEventListener("keydown", press);
        document.removeEventListener("keyup", release);
        document.removeEventListener("mousemove", mouseMoved);
        document.removeEventListener("mousedown", mouseDown);
    }
    // else {
    //     document.removeEventListener("touchstart", mobileDash);
    //     document.removeEventListener("touchmove", mobileDash);
    //     document.removeEventListener("touchstart", touched);
    // }
}

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
        
        // show players
        for(let i = 0; i < playersRenderData.length; i++) {
            showPlayer(playersRenderData[i], i);
        }

        // show explosion
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
            (playersRenderData[potatoRenderData.player].x + 
            ((playersRenderData[potatoRenderData.player].lastx == -1) ? -25 : 25))
                - 60, // x pos
                playersRenderData[potatoRenderData.player].y + 35 - 65, // y pos, and I don't know why the
            // x and y offsets work
            explosion.width,// width of image
            explosion.height// height of image
        );

        ++explosion.frame;
        
        // if not done with animation, call function again
        if(explosion.frame < explosion.rows * explosion.cols)
            window.setTimeout(explosion.show, 1000 / 15);
        // the last frame of animation still shows something
        // so after animation is over, remove explosion
        else {
            r.clearRect(0, 0, w, h);

            if(playersRenderData.length == 2) {
                document.getElementById("gameOverText").innerHTML = 
                "You Win!";
            }
            else {
                document.getElementById("gameOverText").innerHTML = 
                "You Survived!";
            }
            // don't show exploded player
            if(potatoRenderData.player != index)
                showPlayer(playersRenderData[index], index);
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
                
                for(let i = 0; i < playersRenderData.length; i++) {
                    showPlayer(playersRenderData[i], i);
                }
            }
            
            // player lost text
            // css because custom font face with canvas would not work
            // nevermind, got it to work, but I don't want to change this
            // because it already works, and I think this is easier
            document.getElementById("gameOverText").style.visibility = "visible";

            let wait0 = 5;
            let wait1 = 2;
            // remove exploded player
            if(potatoRenderData.player == index) {
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
                    if(playersRenderData.length == 2) {
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
                                if(i != potatoRenderData.player &&
                                i == index) {
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

socket.on("game over", () => {
    removeListeners();

    r.clearRect(0, 0, w, h);
    for(let i = 0; i < playersRenderData.length; i++) {
        playersRenderData[i].inDash = false;
        showPlayer(playersRenderData[i], i);
    }

    showPotato(potatoRenderData);

    window.setTimeout(explosion.show, 500);
});

// someone left the game, so other players are kicked from game
socket.on("cancel game", (playerWhoLeft) => {
    removeListeners();

    // // hide mobile controls and stop getting data from joystick
    // if(mobile) {
    //     window.clearInterval(joystickInterval);
    //     document.getElementById("mobileDashImg").style.visibility = "hidden";
    //     document.getElementById("joystickContainer").style.visibility = "hidden";
    // }

    document.getElementById("gameOverText").style.visibility = "hidden";

    window.alert(
        playerWhoLeft + " left the game, so the game ended.");

    backToMainMenu();
});