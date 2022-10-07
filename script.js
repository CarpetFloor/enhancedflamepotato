// note that id is actual string id of client
// and clientId is index in players array that client is
let socket = io();
let id = -1;
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


//-- actual game stuff --\\


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
let mapLoaded = false;// map.show() has to be called from a setTimeout,
// so until the function has actually been called and loaded don't allow
// the game to start
let over = false;
let fps = -1;
let timeUntilNextFrame = -1;
let potatoFrame = 0;// current frame of the main game loop
let maxPotatoFrame = -1;// last frame of the main game loop
let showHitboxes = false;// for debugging
let players = [];// objects of all players in the game
let clientId = -1;// index of object in players array that c1ient is
let lastMousex = 0;
let lastMousey = 0;
let mainLoop;
let startWait = -1;
let recentlyPassed = false;
let profanity = false;
let playerColors = ["yellow", "lime", "cornflowerBlue", "red"];
let playerNames = ["yellow", "green", "blue", "red"];
let gameStarted = false;
let clientData;
let potatoData;
let extrapolateInterval;
let extrapolateFinished = false;

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
};

function Player(id) {
    this.img = new Image();
    this.id = id,
    this.skin = 0,
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
    this.speed = 17,
    this.dashPressed = false,
    this.canDash = true,
    this.dashMultiplier = 4,
    this.dashFrame = 0,
    this.maxDashFrame = 8,
    this.dashWaitFrame = 0,
    this.maxDashWaitFrame = fps * 5,
    // right, bottom-right, bottom, bottom-left, left, top-left, top, top-right
    this.lastDir = 0,
    this.hasSentData = false,
    this.setUp = function() {
        this.img.src = "Assets/Players.png";
        this.dashWaitFrame = this.maxDashWaitFrame;
    },
    this.show = function() {
        // mouse hitbox
        if(showHitboxes) {
            r.fillStyle = "green";
            r.fillRect(lastMousex - 5, lastMousey - 5, 10, 10);
        }
        // set correct x direction based off of last mouse position
        /* direction on mobile devices is already set when throwing
        potato and when moving*/
        if(!mobile) {
            if(this.x > lastMousex)
                this.lastx = -1;
            else
                this.lastx = 1;
        }

        // flip image if facing left by clipping image farther to right
        // because the Players.png image is all skins facing right, 
        // then all skins facing left
        let clipx = this.width * this.skin;
        // I did some strange trial and error
        // to get this to work, so I have no idea how this works
        if(this.lastx == -1) {
            let move = this.maxSkins - this.skin;
            clipx += (move + (move - 1)) * this.width;
        }
        // a bit of the next frame is showing,
        // so do this i guess

        // player hitbox
        if(showHitboxes) {
            let hitboxSize = 70;

            r.fillStyle = "green";
            r.fillRect(this.x - (hitboxSize / 2), this.y - (hitboxSize / 2),
            hitboxSize,
            hitboxSize);
        }

        // client "you" textbox
        // don't show when the game is over
        if(!over) {
            r.globalAlpha = ui.transparency;
            r.fillStyle = "black"

            let width = 47;
            let height = 25;

            r.fillRect(
            this.x - (width / 2), 
            this.y - (this.height / 2) - (height / 2) - 18,
            width,
            height);
            
            r.fillStyle = playerColors[clientId];
            r.font = "30px VT323";
            r.fillText(
            "YOU", 
            this.x - (width / 2) + 5, 
            this.y - (this.height / 2) - (height / 2) + 2);

            r.globalAlpha = 1;
        }


        // actually draw the player
        r.drawImage(
            this.img,// image
            clipx,// cliiping x start
            this.animationFrame * this.height,// clipping y start
            this.width,// width of clipping
            this.height,// height of clipping
            this.x - (this.width / 2),
            this.y - (this.height / 2),
            this.width,// width of image
            this.height// height of image
        )

        /* reset dirx and diry, because dirx and diry are never set 
        with mobile controls, but set in player processs input 
        function for border restriction, so neither will get set to 
        0 when not moving on mobile and animation will never stop*/
        if(mobile) {
            if(joystickData.movex === 0)
                this.dirx = 0;
            if(joystickData.movey === 0)
                this.diry = 0;
        }

        // set next frame of animation when this function is called next frame
        // if the player is moving
        if(this.dirx != 0 || this.diry != 0) {
            ++this.animationWaitFrame;

            if(this.animationWaitFrame >= this.maxAnimationWaitFrame) {
                this.animationWaitFrame = 0;
                ++this.animationFrame;

                if(this.animationFrame >= this.maxAnimationFrame)
                    this.animationFrame = 0;
            }
        }
        // when player is not moving, go to idle frame of animation
        else {
            this.animationWaitFrame = 0;
            this.animationFrame = 0;
        }
    },
    this.processInput = function() {
        // dash
        // only allow dash if moving
        // don't need to check if not mobile because when mobile,
        // dashPressed is never set to true
        if(this.dashPressed) {
            if(this.dashFrame == 0) {
                this.canDash = false;
                this.dashWaitFrame = 0;
                // with more players dash stuff here
                switch(clientId) {
                    case 0:
                        dashEffectR0.beginPath();
                        dashEffectR0.moveTo(this.x, this.y);
                        dashEffectR0.lineTo(this.x, this.y);
                        break;
                    case 1:
                        dashEffectR1.beginPath();
                        dashEffectR1.moveTo(this.x, this.y);
                        dashEffectR1.lineTo(this.x, this.y);
                        break;
                    case 2:
                        dashEffectR2.beginPath();
                        dashEffectR2.moveTo(this.x, this.y);
                        dashEffectR2.lineTo(this.x, this.y);
                        break;
                    case 3:
                        dashEffectR3.beginPath();
                        dashEffectR3.moveTo(this.x, this.y);
                        dashEffectR3.lineTo(this.x, this.y);
                        break;
                }
            }

            //dashEffectR.moveTo(this.x, this.y);
            
            // diagonal dash
            // needs to be normalized
            // and only allow movement on one axis if
            // at the border on the other axis
            if(!mobile) {
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
            else {
                if(this.canMovex)
                    this.x += joystickData.movex * this.dashMultiplier;
                if(this.canMovey)
                    this.y += joystickData.movey * this.dashMultiplier;
            }

            // dash move effect
            // with more players dash stuff here
            switch(clientId) {
                case 0:
                    dashEffectR0.lineTo(this.x, this.y);
                    dashEffectR0.stroke();
                    break;
                case 1:
                    dashEffectR1.lineTo(this.x, this.y);
                    dashEffectR1.stroke();
                    break;
                case 2:
                    dashEffectR2.lineTo(this.x, this.y);
                    dashEffectR2.stroke();
                    break;
                case 3:
                    dashEffectR3.lineTo(this.x, this.y);
                    dashEffectR3.stroke();
                    break;
            }

            // change counter for how many frames in dash
            // and then if reached max frames stop dash
            ++this.dashFrame;
            if(this.dashFrame >= this.maxDashFrame) {
                this.dashPressed = false;
                this.dashFrame = 0;

                // clear dash move effect
                // with more players dash stuff here
                switch(clientId) {
                    case 0:
                        dashEffectR0.clearRect(0, 0, w, h);
                        break;
                    case 1:
                        dashEffectR1.clearRect(0, 0, w, h);
                        break;
                    case 2:
                        dashEffectR2.clearRect(0, 0, w, h);
                        break;
                    case 3:
                        dashEffectR3.clearRect(0, 0, w, h);
                        break;
                }
            }
        }
        // when dash is not occuring, increase frame counter for how
        // wait until dash can occur again
        else if(this.dashWaitFrame < this.maxDashWaitFrame) {
            ++this.dashWaitFrame;

            // reached max amount of wait frames
            if(this.dashWaitFrame >= this.maxDashWaitFrame)
                this.canDash = true;
        }

        let margin = 10;
        if(mobile) {
            if(joystickData.movex > 0)
                this.dirx = 1;
            if(joystickData.movex < 0)
                this.dirx = -1;
            if(joystickData.movey > 0)
                this.diry = 1;
            if(joystickData.movey < 0)
                this.diry = -1;
        }
        
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

        if(!mobile) {
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
        else {
            if(this.canMovex)
                this.x += joystickData.movex;
            if(this.canMovey)
                this.y += joystickData.movey;
        }

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

let potato = {
    img: new Image(),
    x: 0,
    y: 0,
    dir: 1,
    size: 60,
    yOffset: 30,
    player: -1,
    attached: false,
    threw: false,
    canBeThrown: true,
    throwx: 1,
    throwFrame: 0,
    maxThrowFrame: 5,
    throwSpeed: 150,
    mouseThrowx: 0,// the mouse x position when clicked to throw
    mouseThrowy: 0,// the mouse y position when clicked to throw
    throwMovex: 0,// how much to move each frame on x axis during throw
    throwMovey: 0,// how much to move each frame on y axis during throw
    loadImage: function() {
        this.img.src = "Assets/Potato.png";
    },
    show: function() {
        r.drawImage(this.img, // img
            (this.dir == 1) ? 0 : this.size, // clip x start
            0, // clip y start
            this.size, // clip x end
            this.size, // clip y end
            this.x - (this.size / 2), // x
            this.y - this.yOffset, // y
            this.size, // width 
            this.size); // height
    },
    movement: function() {
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
}; potato.loadImage();

// everything should be slightly transparent because ui is drawn over everything
// and stuff behind ui should still be visible
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

function inCollision(fromX, fromY, toX, toY) {
    return (Math.sqrt(
        Math.pow(Math.abs(toX - fromX), 2)
        +
        Math.pow(Math.abs(toY - fromY), 2)
    ) < 210);
}

// NOTE: use size if width and height are the same, otherwise use width and height
socket.on("game started", (init) => {
    console.log(init);
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
    mapLoaded = false;

    gameStarted = true;
    over = false;
    fps = init.fps;
    timeUntilNextFrame = 1000 / fps;
    potatoFrame = 0;
    startWait = init.startWait;

    ui.potato.width = w / 2;
    ui.dash.y = h - 130;

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

    // reset potato data for each client
    potato.attached = false;
    potato.threw = false;
    potato.canBeThrown = true;
    potato.throwFrame = 0;

    players.length = 0;
    // add players to players array
    for(let i = 0; i < init.players.ids.length; i++) {
        players.push(new Player(init.players.ids[i]));

        players[i].x = init.players.pos[i][0];
        players[i].y = init.players.pos[i][1];
        
        if(init.players.ids[i] == id) {
            players[i].skin = i;
            clientId = i;
        }

        // set which player has the potato
        if(players[i].id == init.potatoPlyayerId)
            potato.player = i;
        
        if(i == clientId)
            potato.attached = true;
        
        players[i].setUp();
    }
    
    maxPotatoFrame = players.length * fps * 15;

    map.loadImage();
    window.setTimeout(map.show, startWait);// for some reason, map.show is not able
    // to draw anything unless it is called from a window.setTimeout()
});

// all event listener functions
// have to be here in global scope so can be removed later when game is over
let joystickInterval;

/*
non mobile
key pressed
*/
function press(e) {
    // don't allow player to change direction after game over
    // when explosion animation is playing
    // AND for some reason removeEventListener doesn't work
    if((e.keyCode == "65" || e.keyCode == "37") && !over) {
        players[clientId].dirx = -1;
        // incase switch back to no mouse controls
        // players[clientId].lastx = -1;
        players[clientId].lastDir = 4;
    }
    if((e.keyCode == "68" || e.keyCode == "39") && !over) {
        players[clientId].dirx = 1;
        // incase switch back to no mouse controls
        // players[clientId].lastx = 1;
        players[clientId].lastDir = 0;
    }
    if((e.keyCode == "87" || e.keyCode == "38") && !over) {
        players[clientId].diry = -1;
        players[clientId].lastDir = 6;
    }
    if((e.keyCode == "83" || e.keyCode == "40") && !over) {
        players[clientId].diry = 1;
        players[clientId].lastDir = 2;
    }
    // only allow dash if moving
    // and don't have to check to see if the game is still running
    // because function doesn't change player last dir or lastx
    if(e.keyCode == "32" && players[clientId].canDash && 
    (players[clientId].dirx != 0 || players[clientId].diry != 0)) {
        players[clientId].dashDirx = players[clientId].dirx;
        players[clientId].dashDiry = players[clientId].diry;
        players[clientId].dashPressed = true;
    }
    // if player moving diagonally, set last dir to be diagonal
    if((players[clientId].dirx != 0 && players[clientId].diry != 0) && !over) {
        if(players[clientId].dirx == 1) {
            if(players[clientId].diry == 1)
                players[clientId].lastDir = 1;
            else
                players[clientId].lastDir = 7;
        }
        else {
            if(players[clientId].diry == 1)
                players[clientId].lastDir = 3;
            else
                players[clientId].lastDir = 5;
        }
    }
}

/*
non mobile
key released
*/
function release(e) {
    // so that player can hold both right and left, and then
    // only hold right and keep going right, and etc. for the
    // other combinations
    if((e.keyCode == "65" || e.keyCode == "37") && players[clientId].dirx == -1) {
        players[clientId].dirx = 0;
        // for some reason when holding left and up
        // and then letting go of left and only holding up,
        // last dir is still set to left and up,
        // and etc. for all combinations
        if(players[clientId].lastDir == 5)
            players[clientId].lastDir = 6;
        if(players[clientId].lastDir == 3)
            players[clientId].lastDir = 2;
        if((e.keyCode == "87" || e.keyCode == "38") && players[clientId].diry == -1) {
            players[clientId].diry = 0;
            if(players[clientId].lastDir == 5)
                players[clientId].lastDir = 4;
            if(players[clientId].lastDir == 7)
                players[clientId].lastDir = 0;
        }         players[clientId].lastDir = 6;
    }
    if((e.keyCode == "68" || e.keyCode == "39") && players[clientId].dirx == 1) {
        players[clientId].dirx = 0;
        if(players[clientId].lastDir == 1)
            players[clientId].lastDir = 2;
        if(players[clientId].lastDir == 7)
            players[clientId].lastDir = 6;
    }
    if((e.keyCode == "87" || e.keyCode == "38") && players[clientId].diry == -1) {
        players[clientId].diry = 0;
        if(players[clientId].lastDir == 5)
            players[clientId].lastDir = 4;
        if(players[clientId].lastDir == 7)
            players[clientId].lastDir = 0;
    }
    if((e.keyCode == "83" || e.keyCode == "40") && players[clientId].diry == 1) {
        players[clientId].diry = 0;
        if(players[clientId].lastDir == 1)
            players[clientId].lastDir = 0;
        if(players[clientId].lastDir == 3)
            players[clientId].lastDir = 4;
    }
}

/*
non mobile
mouse moved
*/
function mouseMoved(e) {
    // whoever thought that getting the position of the mouse
    // would be this hard
    let bounds = c.getBoundingClientRect();
    lastMousex = e.pageX - bounds.left - scrollX;
    lastMousey = e.pageY - bounds.top - scrollY;

    lastMousex /= bounds.width; 
    lastMousey /= bounds.height;

    lastMousex *= w;
    lastMousey *= h;
};

/*
non mobile
mouse clicked
*/
function mouseDown(e) {
    if(potato.player == clientId &&
    potato.canBeThrown && potato.attached && mapLoaded && !over) {
        let bounds = c.getBoundingClientRect();
        lastMousex = e.pageX - bounds.left - scrollX;
        lastMousey = e.pageY - bounds.top - scrollY;

        lastMousex /= bounds.width; 
        lastMousey /= bounds.height;

        lastMousex *= w;
        lastMousey *= h;

        potato.throwFrame = 0;
        potato.threw = true;
    }
}

/*
mobile
canvas touched
*/
function touched(e) {
    if(potato.player == clientId &&
    potato.canBeThrown && potato.attached && mapLoaded && !over) {
        let evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
        let touch = evt.touches[evt.touches.length - 1] || 
        evt.changedTouches[evt.touches.length - 1];
        let bounds = c.getBoundingClientRect();
        lastMousex = touch.pageX - bounds.left - scrollX;
        lastMousey = touch.pageY - bounds.top - scrollY;

        lastMousex /= bounds.width; 
        lastMousey /= bounds.height;

        lastMousex *= w;
        lastMousey *= h;

        potato.throwFrame = 0;
        potato.threw = true;
    }
}

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
    else
        document.getElementById("mainCanvas").addEventListener("touchstart", touched);

    // show mobile controls
    if(mobile) {
        document.getElementById("mobileDashImg").style.visibility = "visible";
        document.getElementById("joystickContainer").style.visibility = "visible";
    }

    extrapolateInterval = window.setInterval(extrapolate, timeUntilNextFrame);
    loop();
}

let joystickConfig = {
    "internalFillColor": "#34495E",
    "internalStrokeColor": "#283747",
    "internalLineWidth": 4,
    "externalStrokeColor": "#212F3D",
    "externalLineWidth": 5
};
// syntax is correct here
let joystick = new JoyStick("joystickContainer", joystickConfig);

let joystickData = {
    x: 0,
    y: 0,
    movex: 0,
    movey: 0
}
function mobileMove() {
    // don't have to check if started because this function
    // only called when game is running
    if(!over) {
        joystickData.movex = 0;
        joystickData.movey = 0;

        if(joystickData.x != 0 || joystickData.y != 0) {                        
            // actually set how much the player should move by on x and y
            // do so by normalizing vector of relative position of joystick
            let hypotenuse = Math.sqrt(
                Math.pow(joystickData.x, 2) + Math.pow(joystickData.y, 2));
            let normalized = {
                x: joystickData.x / hypotenuse,
                y: (0 - joystickData.y) / hypotenuse
            }
            if(players[clientId].canMovex) {
                joystickData.movex =  normalized.x * players[clientId].speed;
            }
            if(players[clientId].canMovey) {
                joystickData.movey = normalized.y * players[clientId].speed;
            }

            // set player direction
            if(joystickData.movex >= 0)
                players[clientId].lastx = 1;
            else
                players[clientId].lastx = -1;
        }
    }
}

// make dash button work on mobile
function mobileDash() {
    if(!over/* && gameStarted*/) {
        if(players[clientId].canDash && 
        (players[clientId].dirx != 0 || players[clientId].diry != 0)) {
            players[clientId].dashDirx = players[clientId].dirx;
            players[clientId].dashDiry = players[clientId].diry;
            players[clientId].dashPressed = true;
        }
    }
}

function renderStuff() {
    r.clearRect(0, 0, w, h);

    // bar at the top that shows how much longer the game will last for,
    // on second thought, this might not be the best name
    ui.showPotato();
    ui.showDash();
    
    // render other clients first so client is on top :)
    showOtherPlayers();

    // render client last so that they are on top of other clients
    players[clientId].show();

    potato.show();
}

/*
function processStuff() {
    players[clientId].processInput();
    
    if(potato.player == clientId)
        potato.movement();
}
*/

function setData() {
    // only send client data that is actually needed
    clientData = {
        id: players[clientId].id,
        x: players[clientId].x,
        y: players[clientId].y,
        lastx: players[clientId].lastx,
        dirx: (mobile) ? joystickData.movex : players[clientId].dirx,
        diry: (mobile) ? joystickData.movey : players[clientId].diry,
        animationFrame: players[clientId].animationFrame,
    }

    // only send potato data that is actually needed
    if(potato.player == clientId || recentlyPassed)
        potatoData = {
            player: potato.player,
            x: potato.x,
            y: potato.y,
            attached: potato.attached
        }
    else
        potatoData = "nothing"
    
    if(recentlyPassed)
        recentlyPassed = false;
}

function extrapolate() {
    if(!over) {
        extrapolateFinished = false;

        renderStuff();

        players[clientId].processInput();

        let speed = players[0].speed;

        for(let i = 0; i < players.length; i++) {
            if(i != clientId) {
                // mobile
                // for mobile, continue going in the last inputed direction
                if(players[i].dirx != 0 && players[i].dirx != 1 && players[i].dirx != -1) {
                    players[i].x += players[i].dirx;
                    players[i].y += players[i].diry;
                }
                // not mobile
                else {
                    // lol forgot to normalize for way too long
                    // diagonal
                    if(players[i].dirx != 0 && players[i].diry != 0) {
                        players[i].x += players[i].dirx * 
                        (speed / (Math.sqrt(Math.pow(speed, 2) + 
                        Math.pow(speed, 2)))) * speed;

                        players[i].y += players[i].diry * 
                        (speed / (Math.sqrt(Math.pow(speed, 2) + 
                        Math.pow(speed, 2)))) * speed;
                    }
                    // not diagonal
                    else {
                        players[i].x += players[i].dirx * speed;
                        players[i].y += players[i].diry * speed;
                    }
                }
            }
        }

        extrapolateFinished = true;
    }
}

// main game loop
function loop() {
    if(!over) {
        renderStuff();
        
        if(potato.player == clientId)
            potato.movement();

        setData();
        players[clientId].hasSentData = true;
        socket.emit("send client data", clientData, lobby, potatoData, potatoFrame);
    }
}

function removeListeners() {
    window.clearInterval(extrapolateInterval);

    if(!mobile) {
        document.removeEventListener("keydown", press);
        document.removeEventListener("keyup", release);
        document.removeEventListener("mousemove", mouseMoved);
        document.removeEventListener("mousedown", mouseDown);
    }
    else {
        document.removeEventListener("touchstart", mobileDash);
        document.removeEventListener("touchmove", mobileDash);
        document.removeEventListener("touchstart", touched);
    }
}

function gameOver() {
    gameStarted = false;
    over = true;

    // hide mobile controls and stop getting data from joystick
    if(mobile) {
        window.clearInterval(joystickInterval);
        document.getElementById("mobileDashImg").style.visibility = "hidden";
        document.getElementById("joystickContainer").style.visibility = "hidden";
    }

    removeListeners();

    // if potato is on the ground move
    // potato back to player who threw it before exploding
    r.clearRect(0, 0, w, h);
    players[clientId].show();
    showOtherPlayers();

    potato.x = players[potato.player].x + 
    ((players[potato.player].lastx == -1) ? -25 : 25);
    potato.y = players[potato.player].y + 35;
    
    potato.show();

    window.setTimeout(explosion.show, 500);
};

socket.on("cancel game", () => {
    over = true;

    removeListeners();

    // hide mobile controls and stop getting data from joystick
    if(mobile) {
        window.clearInterval(joystickInterval);
        document.getElementById("mobileDashImg").style.visibility = "hidden";
        document.getElementById("joystickContainer").style.visibility = "hidden";
    }

    document.getElementById("gameOverText").style.visibility = "hidden";

    window.alert(
        "Someone you were playing with with " + 
        "left your game, so the game ended.");

    backToMainMenu();

    /*
    window.setTimeout(() => {
        window.alert(
            "Someone you were playing with with " + 
            "left your game, so the game ended.");
    }, 20);
    */
});

// client is receiving data from the server
socket.on("send server data", (playersData, potatoData, frame) => {
    if(potatoData != "nothing") {
        potato.player = potatoData.player;
        potato.x = potatoData.x;
        potato.y = potatoData.y;
        potato.attached = potatoData.attached;
    }

    for(let i = 0; i < playersData.length; i++) {
        // set data of other players
        // don't need to update client
        if(playersData[i].id != id) {
            players[i].x = playersData[i].x;
            players[i].y = playersData[i].y;
            players[i].lastx = playersData[i].lastx;
            players[i].dirx = playersData[i].dirx;
            players[i].diry = playersData[i].diry;
            players[i].animationFrame = playersData[i].animationFrame;
        }
    }

    if(players[clientId].hasSentData) {
        ++potatoFrame;
    }

    if(potatoFrame < frame)
            potatoFrame = frame;

    if(players[clientId].hasSentData) {
        players[clientId].hasSentData = false;

        if(potatoFrame >= maxPotatoFrame)
            gameOver();
        else
            window.setTimeout(loop, timeUntilNextFrame);
    }
});

function showOtherPlayers() {
    for(let i = 0; i < players.length; i++) {
        if(i != clientId) {
            let clipx = players[i].width * i;
            // I did some strange trial and error
            // to get this to work, so I have no idea how this works
            if(players[i].lastx == -1) {
                let move = players[i].maxSkins - i;
                clipx += (move + (move - 1)) * players[i].width;
            }
            
            // player
            // when game over, don't show exploded player
            if(
            !over || 
            (over && explosion.frame < 1) || 
            (over && explosion.frame > 0 && potato.player != i))
                r.drawImage(
                    players[i].img,// image
                    clipx,// cliiping x start
                    players[i].animationFrame * players[i].height,// clipping y start
                    players[i].width,// width of clipping
                    players[i].height,// height of clipping
                    players[i].x - (players[i].width / 2),
                    players[i].y - (players[i].height / 2),
                    players[i].width,// width of image
                    players[i].height// height of image
                );
        }
    }
}
