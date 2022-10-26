// resizes everything for mobile devices
// AND resizes canvases for NON-mobile devices

// jQuery kind of looks like CSS, but different

let mobile = false;
let mobileWidth = 615;
let mobileHeight = 410;

$(document).ready(function() {
    window.setTimeout(doMobileStuff, 200);
});


function doMobileStuff() {
    // warn the client about possible bugs
    /*window.alert("This game might have some bugs. If you do run into "
    + "a bug, refreshing the page should most likely fix it; "
    + "or at least temporarily. :)");*/

    // check if device is a mobile device
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test
    (navigator.userAgent)) {
        mobile = true;
        // call function in script.js to let server no, because not using socket.io in this file
        letServerKnowPlayerIsMobile();
    };

    if(mobile) {
        landscapeCheck();
        // resize game canvases
        // why does this actually work
        /* I have no clue because I set the canvas css size to phone screen size,
        but when game starts, js sets the canvas css size to what it should be for
        computer. And somehow adding this code here scales the canvas down.*/
        $("#layers").children().each(function() {
            $(this).css({
                "margin-top":"5px",
                "width":"60vw",
                "height":"65vh",
            });
        })

        setMobileView();
    }
    else {
        let mobileHeight = Math.floor(window.innerHeight - 70);
        let mobileWidth = Math.floor(mobileHeight * 1.7);

        // resize game canvases
        $("#layers").children().each(function() {
            $(this).css({
                "margin-top":"0",
                "width":mobileWidth.toString() + "px",
                "height":mobileHeight.toString() + "px",
            });
        })
    }
}

function landscapeCheck() {
    let w = window.innerWidth;
    let h = window.innerHeight;

    if(h > w) {
        window.alert("Please use landscape mode.");

        window.setTimeout(
            () => {landscapeCheck()}, 1500);
    }
}

// actually make everything look good on mobile
function setMobileView() {
    // menu stuff
    let defaultMargin = "10px";

    $(".menu").css({
        "width":"100vw",
        "height":"100vh",
        "margin":"0",
        "overflow": "auto"
    });

    // main menu
    $("#menuTitle").css({
        "font-size":"100px",
        "margin":"0",
        "margin-top":"-5vh"
    });

    $("#menuSubText").css({
        "margin-bottom":"10px"
    });

    $(".menuButton").css({
        "margin-bottom":"5px"
    });

    // settings
    $("#settingsText").css({
        "font-size":"25px",
        "margin":"0",
        "margin-bottom":defaultMargin,
        "margin-left":"100px",
        "margin-right":"100px"
    });

    // join
    $("#joinInput").css({
        // reorder join menu so input is on bottom
        /* because sometimes the input keyboard-or-numberpad-thing
        can go over and hide all of the other items*/
        "order":"4",
        "margin":"0"
    });

    // when entering game id shrink buttons and input so that keyboard won't hide input
    $("#joinInput").focus(function() {
        let newHeight = "40px";

        $("#joinInput").css({
            "height":"30px",
            "width":"200px",
            "font-size":"30px"
        });

        $("#joinMenuButtons").css({
            "height":newHeight
        });
        
        $("#joinLobbyButton, #lobbyMainMenuButton").css({
            "font-size":"35px",
            "height":newHeight
        });

        $("#joinNotice").css({
            "margin-top":"0",
        });
    });

    // set things back to normal after game id input is out of focus
    $("#joinInput").focusout(function() {
        let newHeight = "58px";

        $("#joinInput").css({
            "height":"56px",
            "width":"300px",
            "font-size":"50px"
        });

        $("#joinMenuButtons").css({
            "height":newHeight
        });
        
        $("#joinLobbyButton, #lobbyMainMenuButton").css({
            "font-size":"50px",
            "height":newHeight
        });

        $("#joinNotice").css({
            "margin-top":"5px"
        });
    });

    $("#joinNotice").css({
        "margin":"0",
        "margin-top":"5px"
    });

    // make join and main menu buttons left and right instead of up and down
    $("#joinMenuButtons").css({
        "display":"flex",
        "flex-direction":"row",
        "justify-content":"space-evenly",
        "width":"95vw"
    });

    $("#joinLobbyButton, #lobbyMainMenuButton").css({
        "margin":"0"
    });

    // move buttons beneath name change input to the left and right of input
    $("#settingsDiv").css({
        "flex-direction":"row"
    });
    // following 3 make input in the middle
    $("#settingBackToMainMenuButton").css({
        "order":1,
        "width":250
    });
    $("#nameInput").css({
        "order":2
    });
    $("#changeNameButton").css({
        "order":3,
        "width":250
    });

    // lobby
    // make layout horizontal
    $("#lobby").css({
        "display":"flex",
        "flex-direction":"row",
        "justify-content":"flex-start",
        "align-items":"flex-start"
    });

    $(".lobbyContainers").css({
        "width":"45vw"
    });

    // add spacing between left and right
    $("#firstLobbyContainer").css({
        "width":"40vw",
        "margin-right":"3.5vw"
    });

    $(".lobbyButtons").css({
        "width":"100%"
    });

    // less spacing between you and players
    $("#lobbyTopText").css({
        "margin-top":"10px"
    });

    // make game id and you be aligned
    $("#gameId").css({
        "margin-top":"10px"
    });

    $("#playerName").css({
        "margin-top":"3px",
        "width":"90%",
        "font-size":"25px"
    });

    // mobile controls
    let dashSize = "110px";

    $("#mobileDashImg, #mobileButtonsDash").css({
        "width":dashSize,
        "height":dashSize,
        "margin":"0",
        //"visibility":"hidden"
    });

    $("#mobileButtonsDash").css({
        "margin-top":("-" + dashSize),
        "visibility":"visible",
        "opacity":"0"
    });

    $("#mobileDashContainer").css({
        "width":dashSize,
        "height":dashSize,
        "position":"absolute",
        //"margin-left":((mobileHorizontalMargin - 1) + "%"),
        "margin-left":"80%",
        "margin-top":"19%"
    });

    $("#joystickContainer").css({
        "touch-action":"none",
        "position":"absolute",
        //"margin-right":(mobileHorizontalMargin + "%"),
        "margin-right":"81%",
        "margin-top":"15%",
        //"visibility":"hidden"
    });

    $("#gameOverText").css({
        "font-size":"150px",
        "margin":"0",
        "margin-top":"-10px"
    });

    window.scroll(0, 0);
}