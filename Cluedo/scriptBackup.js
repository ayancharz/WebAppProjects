var rooms = ['Kitchen', 'Study', 'Living Room', 'Dining Room', 'Library'];
var suspects = ['Mrs. Peacock', 'Mrs. Green', 'Miss Scarlet', 'Colonel Mustard', 'Professor Plum'];
var weapons = ['Pistol', 'Knife', 'Wrench', 'Lead Pipe', 'Candlestick'];
var triplet = [];
var globalArray = [];
var globalNonTArray = [];
var player = [];
var AI = [];
var toggle = true;
var reprintToggle = false;
var playerGuessStorage = [];
var playerName = "";
function display() {
    document.getElementById('mainList').innerHTML = 'Rooms: ' + rooms.join(', ') + '</br>' +
        'Guests: ' + suspects.join(', ') + '</br>' +
        'Weapons: ' + weapons.join(', ') + '</br>'
    ;
}


function userNameMessage() {
    playerName = document.getElementsByTagName("input")[0].value;
    document.getElementById("nameSpace").innerHTML = "Welcome " + playerName;
    for (var i = 0; i < (suspects.length + weapons.length + rooms.length); i++) {
        if (i < suspects.length) {
            globalArray.push(suspects[i]);
            globalNonTArray.push(suspects[i]);
        }
        else if (i < suspects.length + weapons.length) {
            globalArray.push(weapons[i - suspects.length]);
            globalNonTArray.push(weapons[i - suspects.length]);
        }
        else if (i < suspects.length + weapons.length + rooms.length) {
            globalArray.push(rooms[i - suspects.length - weapons.length]);
            globalNonTArray.push(rooms[i - suspects.length - weapons.length]);
        }
    }
}


function selectAndDistribute() {
    var trueS = suspects[Math.floor(Math.random() * suspects.length)];
    var trueW = weapons[Math.floor(Math.random() * weapons.length)];
    var trueR = rooms[Math.floor(Math.random() * rooms.length)];
    triplet.push(trueS);
    triplet.push(trueW);
    triplet.push(trueR);

    globalNonTArray.splice(globalNonTArray.indexOf(trueS), 1);
    globalNonTArray.splice(globalNonTArray.indexOf(trueW), 1);
    globalNonTArray.splice(globalNonTArray.indexOf(trueR), 1);

    //randomize to temp
    var tempLength = globalNonTArray.length;

    while (tempLength > 0) {

        var rand = Math.floor(Math.random() * tempLength);

        globalNonTArray.push(globalNonTArray[rand]);
        globalNonTArray.splice(rand, 1);
        tempLength--;
    }
    tempLength = globalNonTArray.length;
    for (var i = 0; i < tempLength; i++) {
        if (i < Math.floor(tempLength / 2)) {
            player.push(globalNonTArray[i])
        } else {
            AI.push(globalNonTArray[i])
        }
    }
    document.getElementById("playerHand").innerHTML = 'Your Hand is - ' + player.join(',');
    createGuessForm();

    for (var j = 0; j < globalArray.length; j++) {

        if (player.indexOf(globalArray[j]) === -1) {

            if (rooms.indexOf(globalArray[j]) !== -1) {
                var option = document.createElement("option");
                option.setAttribute("value", globalArray[j]);
                option.text = globalArray[j];
                document.getElementById("roomsSelect").add(option)
            } else if (weapons.indexOf(globalArray[j]) !== -1) {
                var option = document.createElement("option");
                option.setAttribute("value", globalArray[j]);
                option.text = globalArray[j];
                document.getElementById("weaponsSelect").add(option)
            } else if (suspects.indexOf(globalArray[j]) !== -1) {
                var option = document.createElement("option");
                option.setAttribute("value", globalArray[j]);
                option.text = globalArray[j];
                document.getElementById("suspectsSelect").add(option)
            }
        }
    }
    document.getElementById("Guess").addEventListener("click", playerGuess);
    document.getElementById("Guess").addEventListener("click", reprintHistory);
    console.log(triplet);

}

function playerGuess() {
    var suspectsSelect = document.getElementById("suspectsSelect");
    var roomsSelect = document.getElementById("roomsSelect");
    var weaponsSelect = document.getElementById("weaponsSelect");
    var button = document.createElement("INPUT");
    button.setAttribute("id", "Continue");
    button.setAttribute("type", "button");
    button.setAttribute("value", "Continue");
    var continueMsg = document.createTextNode("Click to continue: ");

    if(!sessionStorage.playerGuess){
        sessionStorage.playerGuess = true;
        playerGuessStorage = [];
        playerGuessStorage.push([suspectsSelect.value,weaponsSelect.value,roomsSelect.value]);
        sessionStorage.backup = JSON.stringify(playerGuessStorage);
    }else{
        playerGuessStorage.push([suspectsSelect.value,weaponsSelect.value,roomsSelect.value]);
        sessionStorage.backup = JSON.stringify(playerGuessStorage);
    }

    document.getElementById("Guess").setAttribute("disabled", "true");
    if (triplet.indexOf(suspectsSelect.value) !== -1 &&
        triplet.indexOf(roomsSelect.value) !== -1 && triplet.indexOf(weaponsSelect.value) !== -1) {

        document.getElementById("winMessage").innerHTML = "Correct Guess! You Win. " + suspectsSelect.value
            + " did it with the "
            + weaponsSelect.value + " in the " + roomsSelect.value;
        button.setAttribute("onclick", "newGame()");
        document.getElementById("winMessage").appendChild(document.createElement("br"));
        document.getElementById("winMessage").appendChild(continueMsg);
        document.getElementById("winMessage").appendChild(button);

        if(!localStorage.win){
            var win = [];
            var date = new Date();
            win[0] = "Player "+playerName+" won on "+date.toLocaleDateString()+" "+date.getHours()+":"+date.getMinutes();
            localStorage.win = JSON.stringify(win);
        }else{
            var win = JSON.parse(localStorage.win);
            var date = new Date();
            win.push("Player "+playerName+" won on "+date.toLocaleDateString()+" "+date.getHours()+":"+date.getMinutes());
            localStorage.win = JSON.stringify(win);
        }

    }
    else {
        if (AI.indexOf(suspectsSelect.value) !== -1) {
            document.getElementById("winMessage").innerHTML = "Incorrect Guess! Computer holds card for " +
                AI[AI.indexOf(suspectsSelect.value)];
        }
        else if (AI.indexOf(roomsSelect.value) !== -1) {
            document.getElementById("winMessage").innerHTML = "Incorrect Guess! Computer holds card for " +
                AI[AI.indexOf(roomsSelect.value)];
        }
        else if (AI.indexOf(weaponsSelect.value) !== -1) {
            document.getElementById("winMessage").innerHTML = "Incorrect Guess! Computer holds card for " +
                AI[AI.indexOf(weaponsSelect.value)];
        }
        button.setAttribute("onclick", "continueGame()");
        document.getElementById("winMessage").appendChild(document.createElement("br"));
        document.getElementById("winMessage").appendChild(continueMsg);
        document.getElementById("winMessage").appendChild(button);
    }

}

function createGuessForm() {
    var form = document.getElementById("guessForm");
    var x = document.createElement("LABEL");
    var t = document.createTextNode("Guess Room: ");
    x.appendChild(t);
    var suspectsSelect = document.createElement("SELECT");
    suspectsSelect.setAttribute("id", "suspectsSelect");

    var roomsSelect = document.createElement("SELECT");
    roomsSelect.setAttribute("id", "roomsSelect");

    var weaponsSelect = document.createElement("SELECT");
    weaponsSelect.setAttribute("id", "weaponsSelect");

    var button = document.createElement("INPUT");
    button.setAttribute("id", "Guess");
    button.setAttribute("type", "button");
    button.setAttribute("value", "Guess");


    form.appendChild(document.createElement("Label").appendChild(document.createTextNode("Guess Suspect :")));
    form.appendChild(suspectsSelect);
    form.appendChild(document.createElement("br"));
    form.appendChild(document.createElement("Label").appendChild(document.createTextNode("Guess Weapon :")));
    form.appendChild(weaponsSelect);
    form.appendChild(document.createElement("br"));
    form.appendChild(document.createElement("Label").appendChild(document.createTextNode("Guess Room :")));
    form.appendChild(roomsSelect);
    form.appendChild(document.createElement("br"));
    form.appendChild(button);


}

function continueGame() {

    console.log("continue");
    document.getElementById("winMessage").innerHTML = "";
    var trueS = suspects[Math.floor(Math.random() * suspects.length)];
    var trueW = weapons[Math.floor(Math.random() * weapons.length)];
    var trueR = rooms[Math.floor(Math.random() * rooms.length)];
    var button = document.createElement("INPUT");
    button.setAttribute("id", "Continue");
    button.setAttribute("type", "button");
    button.setAttribute("value", "Continue");
    var continueMsg = document.createTextNode("Click to continue: ");

    playerGuessStorage.push([trueS,trueR,trueW]);
    sessionStorage.backup = JSON.stringify(playerGuessStorage);
    reprintHistory();

    if (triplet.indexOf(trueW) !== -1 &&
        triplet.indexOf(trueR) !== -1 && triplet.indexOf(trueS) !== -1) {

        document.getElementById("winMessage").innerHTML = "Correct Guess! Computer Wins. " + trueS
            + " did it with the "
            + trueW + " in the " + trueR;
        button.setAttribute("onclick", "newGame()");
        document.getElementById("winMessage").appendChild(document.createElement("br"));
        document.getElementById("winMessage").appendChild(continueMsg);
        document.getElementById("winMessage").appendChild(button);

        if(!localStorage.win){
            var win = [];
            var date = new Date();
            win[0] = "Computer won against "+playerName+" on "+date.toLocaleDateString()+" "+date.getHours()+":"+date.getMinutes();
            localStorage.win = JSON.stringify(win);
        }else{
            var win = JSON.stringify(localStorage.win);
            var date = new Date();
            win.push("Computer won against "+playerName+" on "+date.toLocaleDateString()+" "+date.getHours()+":"+date.getMinutes());
            localStorage.win = JSON.stringify(win);
        }

    }
    else {
        document.getElementById("winMessage").innerHTML = "The Computer made an Incorrect guess:- " + trueS
            + " did it with the "
            + trueW + " in the " + trueS;
        console.log("before en");
        button.setAttribute("onclick", "enablePlayer()");
        document.getElementById("winMessage").appendChild(document.createElement("br"));
        document.getElementById("winMessage").appendChild(continueMsg);
        document.getElementById("winMessage").appendChild(button);
    }


}

function enablePlayer() {
    console.log("enable");
    document.getElementById("winMessage").innerHTML = "";
    document.getElementById("Guess").removeAttribute("disabled");
}

function newGame() {


    document.getElementById("playerHand").innerHTML = "";
    document.getElementById("guessForm").innerHTML = "";
    document.getElementById("winMessage").innerHTML = "";

    triplet.pop();
    triplet.pop();
    triplet.pop();

    player = [];
    AI = [];
    globalArray = [];
    globalNonTArray = [];

    var backup = [];
    sessionStorage.backup = JSON.stringify(backup);
    playerGuessStorage = [];

    var formElement = document.getElementById("nameSpace");
    formElement.innerHTML = "";
    var nameText = document.createTextNode("Name: ");
    var nameInput = document.createElement("INPUT");
    nameInput.setAttribute("type", "text");
    var button = document.createElement("INPUT");
    button.setAttribute("id", "userNameButton");
    button.setAttribute("type", "button");
    button.setAttribute("value", "Enter");

    formElement.appendChild(nameText);
    formElement.appendChild(nameInput);
    formElement.appendChild(button);

    button.addEventListener("click", userNameMessage);
    button.addEventListener("click", selectAndDistribute);


}

function history() {
    var historyButton = document.getElementById("historyButton");
    var historyText = document.getElementById("showHistory");
    var backup = [];
    console.log(sessionStorage.playerGuess);
    historyText.innerHTML = "";
    if (toggle) {
        toggle = false;
        reprintToggle = true;
        historyButton.innerHTML = "Hide History";
        if (sessionStorage.playerGuess) {
            backup = JSON.parse(sessionStorage.backup);
            for (var i = 0; i < backup.length; i++) {

                historyText.appendChild(document.createElement("br"));
                if(i%2 === 0)
                    historyText.appendChild(document.createTextNode("Player's guess was "));
                else
                    historyText.appendChild(document.createTextNode("Computer's guess was "));
                historyText.appendChild(document.createTextNode(backup[i].join(",")));
            }
        }
    } else {
        toggle = true;
        reprintToggle = false;
        historyButton.innerHTML = "Show History";
        historyText.innerHTML = "";
    }

}


function showRecord() {

    document.getElementById("recordHistory").innerHTML = "";
    if(!localStorage.win){

    }else{
        var record = JSON.parse(localStorage.win);
        for (var i=0;i<record.length;i++){
            document.getElementById("recordHistory").appendChild(document.createTextNode(record[i].toString()));
            document.getElementById("recordHistory").appendChild(document.createElement("br"));

        }
    }


}

function reprintHistory(){
    var historyText = document.getElementById("showHistory");

    if (reprintToggle) {
        historyText.innerHTML = "";
        if (sessionStorage.playerGuess) {
            var backup = JSON.parse(sessionStorage.backup);
            for (var i = 0; i < backup.length; i++) {

                historyText.appendChild(document.createElement("br"));
                if(i%2 === 0)
                    historyText.appendChild(document.createTextNode("Player's guess was "));
                else
                    historyText.appendChild(document.createTextNode("Computer's guess was "));
                historyText.appendChild(document.createTextNode(backup[i].join(",")));
            }
        }
    }
}