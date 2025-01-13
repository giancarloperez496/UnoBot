var discord = require("discord.js");
var bot = new discord.Client();

const UnoColors = [
    "Red",
    "Green",
    "Blue",
    "Yellow",
];

const msgColors = [
    "red",
    "green",
    "blue",
    "yellow",
];

const UnoTypes = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "WildCard",
    "DrawTwo",
    "DrawFour",
    "Skip",
    "Reverse"
];

function capitalize(s) {
    if (typeof(s) !== 'string') {
        return '';
    }
    return s.charAt(0).toUpperCase() + (s.slice(1)).toLowerCase();
}

class UnoCard {
    constructor(color, type) {
        this.color = color;
        this.type = type;
        if (type == "WildCard" || type == "DrawFour") {
            this.name = type;
        }
        else {
            this.name = color + type;
        }
    }
}

function getRandom(list) {
    return list[Math.floor((Math.random()*list.length))];
  } 

class UnoPlayer {
    constructor(member, channel, deck) {
        this.guildMember = member; //GuildMember
        this.playingChannel = channel; //TextChannel
        this.currentDeck = deck; //array<UnoCard>
    }
}

class Game {
    constructor(guild, channel, playerList, currentCard, leader) {
        this.guildID = guild; //int
        this.channel = channel; //TextChannel
        this.players = playerList; //array<UnoPlayer>
        this.TopCard = currentCard; //UnoCard
        this.leader = leader; //Snowflake 
    }
}

function getHexFromColor(unoclr) {
    switch (unoclr) {
        case "Red":
            return 0xFF0000;
        case "Green":
            return 0x00FF00;
        case "Blue":
            return 0x0000FF;
        case "Yellow":
            return 0xFCBA03;
    }
}

function reverseArrayInPlace(arr, j) {
    arr = arr.reverse();
    var newArr = [];
    for (var i = 0; i < arr.length; i++) {
        newArr[(i+((2*j+1) % arr.length)) % (arr.length)] = arr[i];
    }
    return newArr;
}

bot.on("ready", () => {
    console.log("Bot is ready");
});


var lobbies = {
    /*
    "GuildID": {
        "ChannelID": [
            "MemberID",
            "MemberID"
        ]
    }
    */
};

var ongoingGames = [
    //UnoGame
];

bot.on("message", (msg) => {
    if (!msg.guild) {
        return;
    }
    if (msg.content.toLowerCase().match(/^!unoplay$/g)) {
        if (lobbies[msg.guild.id]) {
            if (lobbies[msg.guild.id][msg.channel.id]) {
                msg.reply("There is already an ongoing lobby in this channel.");
                return;
            }
        }
        for (i = 0; i < ongoingGames.length; i++) {
            if (ongoingGames[i].channel.id == msg.channel.id) {
                msg.reply("There is already an ongoing game in this channel.");
                return;
            }
        }
        lobbies[msg.guild.id] = {};
        lobbies[msg.guild.id][msg.channel.id] = [];
        lobbies[msg.guild.id][msg.channel.id].push(msg.author.id);
        msg.channel.send({
            "embed": {
              "description": "**1 Player:**\n**1)** " + (msg.member.displayName),
              "author": {
                "name": `Current lobby in #${msg.channel.name} (${msg.channel.guild.name})`,
                "url": "https://discordapp.com",
                //"icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
              },
              "footer": {
                "text": "Type !unojoin to join this lobby"
              }
            }
        });
        //msg.channel.send("**"+lobbies[msg.guild.id][msg.channel.id].length + "/6 Players:**\n" + (msg.member.displayName || msg.author.username));       
    }
    if (msg.content.toLowerCase().match(/^!hand$/g)) {
        var unoPlr;
        let gameInChannel;
        for (i = 0; i < ongoingGames.length; i++) {
            if (ongoingGames[i].channel.id == msg.channel.id) {
                gameInChannel = ongoingGames[i];
            }
        }
        if (!gameInChannel) {
            msg.reply("There is no ongoing game in this channel.");
            return;
        }
        for (var j = 0; j < gameInChannel.players.length; j++) {
            if (gameInChannel.players[j].guildMember == msg.member) {
                unoPlr = gameInChannel.players[j];
            }
        }
        if (!unoPlr) {
            msg.reply("You are not in an ongoing game in this channel.");
            return;
        }
        var deckInText = "";
        var deckInEmojis = "";
        for (var k = 0; k < unoPlr.currentDeck.length; k++) {
            deckInText += ("**" + (k + 1)+ ")** " + ((unoPlr.currentDeck[k].type == "WildCard" || unoPlr.currentDeck[k].type == "DrawFour") ? (unoPlr.currentDeck[k].type) : (unoPlr.currentDeck[k].color + " " + unoPlr.currentDeck[k].type))+ "\n");
            deckInEmojis += `<:${unoPlr.currentDeck[k].name}:${CardImageIDs[unoPlr.currentDeck[k].name]}> `;
        }
        unoPlr.guildMember.send({
            "embed": {
              "description": deckInText,
              "author": {
                "name": `Your deck in #${gameInChannel.channel.name} (${gameInChannel.channel.guild.name})`,
                "url": "https://discordapp.com",
                "icon_url": gameInChannel.channel.guild.iconURL()
              },
                "fields": [
                {
                  "name": "Cards:",
                  "value": deckInEmojis,
                }
              ]
            }
          });
    }
    if (msg.content.toLowerCase().match(/^!unojoin$/g)) {
        //FOR JOINING LOBBY IN THE CURRENT GUILD AND CHANNEL
        if (!lobbies[msg.guild.id]) {
            msg.reply("There is no ongoing lobby in this channel.");
            return;
        }
        if (!lobbies[msg.guild.id][msg.channel.id]) {
            msg.reply("There is no ongoing lobby in this channel.");
            return;
        }
        if (lobbies[msg.guild.id][msg.channel.id].includes(msg.author.id)) {
            msg.reply("You are already in this lobby.");
            return;
        }
        let lclPlrList = lobbies[msg.guild.id][msg.channel.id];
        lclPlrList.push(msg.author.id);
        let concat = "";
        for (i = 0; i < lclPlrList.length; i++) {
            concat += "**" + (i + 1) + ")** " + (msg.guild.members.cache.get(lclPlrList[i]).displayName) + '\n';
        }
        msg.channel.send({
            "embed": {
              "description": `**${lclPlrList.length} Players:**\n` + concat,
              "author": {
                "name": `Current lobby in #${msg.channel.name} (${msg.channel.guild.name})`,
                "url": "https://discordapp.com",
                "icon_url": msg.channel.guild.iconURL()
              },
              "footer": {
                "text": "Type !unojoin to join this lobby"
              }
            }
          });
        //msg.channel.send("**"+lclPlrList.length + "/6 Players:**\n" + concat);
    }
    if (msg.content.toLowerCase().match(/^!unostart$/g)) {
        if (!lobbies[msg.guild.id]) {
            msg.reply("There is no ongoing lobby in this channel.");
            return;
        }
        if (!lobbies[msg.guild.id][msg.channel.id]) {
            msg.reply("There is no ongoing lobby in this channel.");
            return;
        }
        if (!lobbies[msg.guild.id][msg.channel.id].includes(msg.author.id)) {
            msg.reply("You are not in a lobby.");
            return;
        }
        if (lobbies[msg.guild.id][msg.channel.id].length < 2) {
            msg.reply("At least 2 players are required to play.");
            return;
        }
        var userList = lobbies[msg.guild.id][msg.channel.id]; 
        var leader = userList[0];
        if (msg.author.id != leader) {
            msg.reply("Only the leader can start the game.");
            return;
        }
        var UnoPlayerList = []; //used for startGame
        for (i = 0; i < userList.length; i++) {
            //plr is GuildMember
            //GENERATING DECK
            var playersDeck = [];
            for (var n = 0; n < 7; n++) {
                playersDeck[n] = new UnoCard(getRandom(UnoColors), getRandom(UnoTypes));
            }
            //END GENERATING DECK
            UnoPlayerList.push(new UnoPlayer(msg.guild.members.cache.get(userList[i]), msg.channel, playersDeck));
        }
        msg.channel.send(`Starting with ${UnoPlayerList.length} players.`);
        startUnoGame(msg.channel, UnoPlayerList, leader);
    }
    if (msg.content.toLowerCase().match(/^!unocancel$/g)) {
        for (i = 0; i < ongoingGames.length; i++) {
            if (ongoingGames[i].channel.id == msg.channel.id) {
                if (ongoingGames[i].leader == msg.author.id) {
                    ongoingGames.splice(i, 1);
                    msg.reply("The game in this channel has been cancelled.");
                    return;
                }
                else {
                    msg.reply("Only the leader can cancel the game.");
                    return;
                }
            } 
        }
        console.log("No game found; searching lobbies");
        var lobbyExists = false;
        if (lobbies[msg.guild.id]) {
            if (lobbies[msg.guild.id][msg.channel.id]) {
                lobbyExists = true;
                if (lobbies[msg.guild.id][msg.channel.id][0] == msg.author.id) {
                    msg.reply("The game in this channel has been cancelled.");
                }
                else {
                    msg.reply("Only the leader can cancel the game.");
                    return;
                }
            }
            else {
                msg.reply("There is no ongoing game in this channel.");
                return;
            }
        }
        else {
            msg.reply("There is no ongoing game in this channel.");
            return;
        }
        if (lobbyExists) {
            delete lobbies[msg.guild.id][msg.channel.id];
        }
    }
    if (msg.content.toLowerCase().match(/^!unoleave$/g)) {
        let lclPlrList = lobbies[msg.guild.id][msg.channel.id];
        if (!lobbies[msg.guild.id]) {
            msg.reply("There is no ongoing lobby in this channel");
            return;
        }
        if (!lclPlrList) {
            msg.reply("There is no ongoing lobby in this channel");
            return;
        }
        if (!lclPlrList.includes(msg.author.id)) {
            msg.reply("You are not in a lobby in this channel.");
            return;
        }
        for (var i = 0; i < lobbies[msg.guild.id][msg.channel.id]; i++) {
            if (lobbies[msg.guild.id][msg.channel.id][i] == msg.author.id) {
                lobbies[msg.guild.id][msg.channel.id].splice(i, 1);
            }
        }
        let concat = "";
        for (i = 0; i < lclPlrList.length; i++) {
            concat += "**" + (i + 1) + ")** " + (msg.guild.members.cache.get(lclPlrList[i]).displayName) + '\n';
        }
        msg.channel.send({
            "embed": {
              "description": `**${lclPlrList.length} Players:**\n` + concat,
              "author": {
                "name": `Current lobby in #${msg.channel.name} (${msg.channel.guild.name})`,
                "url": "https://discordapp.com",
                "icon_url": msg.channel.guild.iconURL()
              },
              "footer": {
                "text": "Type !unojoin to join this lobby"
              }
            }
          });
    }
});
                //TextChannel
function cancelGame(channel) {
    for (var i = 0; i < ongoingGames.length; i++) {
        if (ongoingGames[i].channel.id == channel.id) {
            ongoingGames.splice(i, 1);
        }
    }
    channel.send("The game has been canceled.");
}

//                 Game, UnoPlayer, int
async function drawCards(game, plr, amt) {
    let concat = "";
    var pvdesc;
    var desc;
    var url = "";
    var otherCards = [];
    var firstCard;
    var color;
    for (var i = 0; i < amt; i++) {
        let drawnCard = new UnoCard(getRandom(UnoColors), getRandom(UnoTypes));
        plr.currentDeck.push(drawnCard);
        //console.log(plr);
        if (amt == 1) {
            desc = `${plr.guildMember.displayName} drew a card.`;
            pvdesc = `You drew a ${(drawnCard.type == "WildCard"|| drawnCard.type == "DrawFour") ? "" : drawnCard.color} ${drawnCard.type}`;
            url = `https://cdn.discordapp.com/emojis/${CardImageIDs[drawnCard.name]}.png?v=1`;
            color = getHexFromColor(drawnCard.color);
            firstCard = drawnCard;
        }
        else if (amt > 1) {
            desc = `${plr.guildMember.displayName} drew ${amt} cards.`;
            pvdesc = "You drew ";
            if (i < amt-1) {
                concat += `a ${drawnCard.color} ${drawnCard.type}, `;
            }
            else {
                concat += `and a ${drawnCard.color} ${drawnCard.type}.`;
            }
            if (i > 0) {
                otherCards.push(drawnCard);
            }
            else {
                firstCard = drawnCard;
                url = `https://cdn.discordapp.com/emojis/${CardImageIDs[drawnCard.name]}.png?v=1`;
            }
            color = 0x7FFFFF;
        }
    }
    pvdesc += concat;
    //console.log("Private Description is " + pvdesc);
    await plr.guildMember.send({
        "embed": {
            "description": pvdesc,
            "color": getHexFromColor(firstCard.color),
            "image": {
                "url": url
            },
            "author": {
                "name": `Uno Game in #${game.channel.name} (${game.channel.guild.name}):`,
                "url": "https://discordapp.com",
                "icon_url": game.channel.guild.iconURL()
            }
        }
    });
    if (amt > 1) { 
        for (var j = 0; j < amt-1; j++) {
            console.log(otherCards[j].name);
            plr.guildMember.send({
                "embed": {
                    "color": getHexFromColor(otherCards[j].color),
                    "image": {
                        "url": `https://cdn.discordapp.com/emojis/${CardImageIDs[otherCards[j].name]}.png?v=1`
                    },
                }
            });
        }
    }
    //console.log("public Description is " + desc);
    await game.channel.send({
        "embed": {
            "description": desc,
            "author": {
                "name": `Uno Game in #${game.channel.name} (${game.channel.guild.name}):`,
                "url": "https://discordapp.com",
                "icon_url": game.channel.guild.iconURL()
            }
        }
    });
}

//                  TextChannel, Array<UnoPlayer>
async function startUnoGame(txtchannel, players, ldr) {
    var typeOfTopCard = getRandom(UnoTypes);
    while (!parseInt(typeOfTopCard)) {
        typeOfTopCard = getRandom(UnoTypes);
    }
    delete lobbies[txtchannel.guild.id][txtchannel.id];
    const localTopCard = new UnoCard(getRandom(UnoColors), typeOfTopCard);//only for the first card 
    const curGame = new Game(txtchannel.guild, txtchannel, players, localTopCard, ldr);
    ongoingGames.push(curGame);
    var hasGameBeenWon = false; //boolean
    var winner; //UnoPlayer
    while (!hasGameBeenWon) {
        for (var turn = 0; turn < curGame.players.length; turn++) {
            var playersWhoseTurn = curGame.players[turn]; //UnoPlayer
            if (skippedIteration) {
                console.log(playersWhoseTurn.guildMember.displayName + " was skipped");
                skippedIteration = false;
                continue;
            }
            var nextPlayer = ((turn < curGame.players.length-1) ? curGame.players[turn+1] : curGame.players[0]);
            var url;
            if (curGame.TopCard.type == "DrawFour" || curGame.TopCard.type == "WildCard") {
                url = CardImageIDs[curGame.TopCard.type];
            }
            else {
                url = CardImageIDs[curGame.TopCard.color+curGame.TopCard.type];
            }
            txtchannel.send({
                "embed": {
                    "color": getHexFromColor(curGame.TopCard.color),
                    "footer": {
                        //"icon_url": "https://cdn.discordapp.com/avatars/244060807736852491/2f935ab6d106fbdb8ae5cc6fdeaf3d95.webp?size=128",
                        "text": "Uno by v0idptr"
                    },
                    "thumbnail": {
                        "url": playersWhoseTurn.guildMember.user.avatarURL()
                    },
                    "image": {
                        "url": `https://cdn.discordapp.com/emojis/${url}.png?v=1`
                    },
                    "author": {
                        "name": `Uno Game in #${txtchannel.name} (${txtchannel.guild.name}):`,
                        "url": "https://discordapp.com",
                        "icon_url": txtchannel.guild.iconURL()
                    },
                    "fields": [
                        {
                            "name": "Current Player's Turn",
                            "value": "**"+playersWhoseTurn.guildMember.displayName+"**",
                            "inline": true
                        },
                        {
                            "name": "Next Player's Turn",
                            "value": nextPlayer.guildMember.displayName,
                            "inline": true
                        },
                        {
                            "name": "Current Played Card",
                            "value": `\t\t${curGame.TopCard.color} ${curGame.TopCard.type}`
                        }
                    ]
                }
            });
            var skippedIteration = false;
            var DMsent = await sendDM(txtchannel, playersWhoseTurn.guildMember, playersWhoseTurn.currentDeck, curGame.TopCard);
            const dmchannel = await playersWhoseTurn.guildMember.user.createDM();
            var messageSent = await dmchannel.messages.fetch(DMsent);
            var emojisCollected = await messageSent.awaitReactions((reaction, user) => 
            (
                (
                    (user.id != "614280576677052427") && 
                    (
                        (CardImageIDs[reaction.emoji.name] != null) && 
                        (
                            (getCardFromName(reaction.emoji.name).type == curGame.TopCard.type) || 
                            (getCardFromName(reaction.emoji.name).color == curGame.TopCard.color) || 
                            (getCardFromName(reaction.emoji.name).type == "WildCard" || getCardFromName(reaction.emoji.name).type == "DrawFour")
                        ) 
                        || (reaction.emoji.name == "Draw")
                    )
                )
            ), {max: 1});
            var emojiReacted = emojisCollected.first().emoji.name;
            console.log(playersWhoseTurn.guildMember.displayName + " reacted with " + emojiReacted);
            var cardChosen;
            console.log(emojiReacted == "Draw");
            if (emojiReacted != "Draw") {              
                cardChosen = getCardFromName(emojiReacted);
            }
            else {
                await drawCards(curGame, playersWhoseTurn, 1);
                continue;
            }
            //STACKING
            //var drawStack = 0;
            //var wildCardOrDrawActive = false;
            //console.log("CARD CHOSEN NAME " + cardChosen.name);
            //console.log("CARD TOP NAME " + curGame.TopCard.name);
            if (cardChosen.type == "WildCard" || cardChosen.type == "DrawFour") {
                if (cardChosen.type == "DrawFour") {
                    //drawStack += 4;
                    await drawCards(curGame, nextPlayer, 4);
                    skippedIteration = true;
                }
                let chosenColor;
                if (playersWhoseTurn.currentDeck.length > 1) {
                    do {
                        playersWhoseTurn.guildMember.user.send("Please type a color to switch to.");
                        chosenColor = (await dmchannel.awaitMessages((message) => message.author.id != "705632572423798807", {max: 1})).first().content;
                        console.log(chosenColor);
                        console.log("valid color? : " + msgColors.includes(chosenColor.toLowerCase()));
                    } while (!msgColors.includes(chosenColor.toLowerCase()));
                    curGame.TopCard = cardChosen;
                    curGame.TopCard.color = capitalize(chosenColor);
                    await txtchannel.send({
                        "embed": {
                          "description": `${playersWhoseTurn.guildMember.displayName} played a **${cardChosen.type}**`,
                          "color": getHexFromColor(cardChosen.color),
                          "author": {
                            "name": `Uno game in #${txtchannel.name} (${txtchannel.guild.name})`,
                            "icon_url": txtchannel.guild.iconURL()
                          }
                        }
                      });
                    await txtchannel.send({
                        "embed": {
                            "description": `${playersWhoseTurn.guildMember.displayName} changed the color to **${capitalize(chosenColor)}**.`,
                            "color": getHexFromColor(capitalize(chosenColor)),
                            "author": {
                                "name": `Uno Game in #${txtchannel.name} (${txtchannel.guild.name}):`,
                                "url": "https://discordapp.com",
                                "icon_url": txtchannel.guild.iconURL()
                            }
                        }
                    });
                }
                for (i = 0; i < playersWhoseTurn.currentDeck.length; i++) {
                    //console.log("Card " + i + " is " + playersWhoseTurn.currentDeck[i].name)
                    //console.log("Chosen card is " + cardChosen.name) 
                    if (playersWhoseTurn.currentDeck[i].name == cardChosen.name) {
                        playersWhoseTurn.currentDeck.splice(i, 1);
                    }
                }
            }
            else {
                //console.log("CHOSEN " + cardChosen.name);
                //console.log("TOPCARD BEFORE IS" + curGame.TopCard.name)
                //console.log("CHOSEN IS " + cardChosen.color + " : " + cardChosen.type)
                //console.log("TOP IS " + curGame.TopCard.color + " : " + curGame.TopCard.type)
                /*console.log(curGame.TopCard.color);
                console.log(curGame.TopCard.type);
                console.log(cardChosen.color);
                console.log(cardChosen.type);
                console.log("cardChosen.color == curGame.TopCard.color : " + cardChosen.color == curGame.TopCard.color);
                console.log("cardChosen.type == curGame.TopCard.type : " + cardChosen.type == curGame.TopCard.type);*/
                if ((cardChosen.type == curGame.TopCard.type) || (cardChosen.color == curGame.TopCard.color)) {
                    curGame.TopCard = cardChosen;
                    //REMOVE FROM DECK
                    for (i = 0; i < playersWhoseTurn.currentDeck.length; i++) {
                        //console.log("Card " + i + " is " + playersWhoseTurn.currentDeck[i].name)
                        //console.log("Chosen card is " + cardChosen.name) 
                        if (playersWhoseTurn.currentDeck[i].name == cardChosen.name) {
                            playersWhoseTurn.currentDeck.splice(i, 1);
                            break;
                        }
                    }
                    await txtchannel.send({
                        "embed": {
                          "description": `${playersWhoseTurn.guildMember.displayName} played a **${cardChosen.color} ${cardChosen.type}**`,
                          "color": getHexFromColor(cardChosen.color),
                          "author": {
                            "name": `Uno game in #${txtchannel.name} (${txtchannel.guild.name})`,
                            "icon_url": txtchannel.guild.iconURL()
                          }
                        }
                      })
                    //console.log("TOPCARD AFTER IS " + curGame.TopCard.name);
                    //console.log(cardChosen.type)
                    if (cardChosen.type == "Skip") {
                        await txtchannel.send({
                            "embed": {
                              "description": `**${nextPlayer.guildMember.displayName} has been skipped!**`,
                              "color": getHexFromColor(cardChosen.color),
                              "thumbnail": {
                                "url": nextPlayer.guildMember.user.avatarURL()
                              },
                              "author": {
                                "name": `Uno game in #${txtchannel.name} (${txtchannel.guild.name}):`,
                                "url": "https://discordapp.com",
                                "icon_url": txtchannel.guild.iconURL()
                              }
                            }
                        })
                        await nextPlayer.guildMember.send({
                            "embed": {
                              "description": "You've been skipped!",
                              "author": {
                                "name": `Uno game in #${txtchannel.name} (${txtchannel.guild.name}):`,
                                "url": "https://discordapp.com",
                                "icon_url": txtchannel.guild.iconURL()
                              }
                            }
                        })
                        console.log("SENT");
                        skippedIteration = true;
                    }
                    if (cardChosen.type == "DrawTwo") {
                        console.log(nextPlayer.guildMember.displayName);
                        await drawCards(curGame, nextPlayer, 2);
                        skippedIteration = true;
                    }
                    if (cardChosen.type == "Reverse") {
                        console.log("turn IS " + turn)
                        //console.log("[" + curGame.players[0].guildMember.displayName + ", " + curGame.players[1].guildMember.displayName + ", " + curGame.players[2].guildMember.displayName + "]");
                        curGame.players = reverseArrayInPlace(curGame.players, turn);
                        //console.log("[" + curGame.players[0].guildMember.displayName + ", " + curGame.players[1].guildMember.displayName + ", " + curGame.players[2].guildMember.displayName + "]");
                    }
                }
            }
            console.log("PLAYER DECK LENGTH IS " + playersWhoseTurn.currentDeck.length);
            
            if (playersWhoseTurn.currentDeck.length == 0) {
                hasGameBeenWon = true;
                winner = playersWhoseTurn;
                await txtchannel.send({
                    "embed": {
                      "description": `<@${winner.guildMember.user.id}> has won the game.`,
                      "author": {
                        "name": `Uno game in #${txtchannel.name} (${txtchannel.guild.name})`,
                        "icon_url": txtchannel.guild.iconURL()
                      }
                    }
                  });
                for (var i = 0; i < ongoingGames.length; i++) {
                    if (ongoingGames[i].channel.id == curGame.channel.id) {
                        ongoingGames.splice(i, 1);
                    }
                }
                await playersWhoseTurn.guildMember.send({
                    "embed": {
                      "description": "You won the game!",
                      "author": {
                        "name": `Uno game in #${txtchannel.name} (${txtchannel.guild.name}):`,
                        "url": "https://discordapp.com",
                        "icon_url": txtchannel.guild.iconURL()
                      }
                    }
                });
                break;
            }
            else if (playersWhoseTurn.currentDeck.length == 1) {
                await txtchannel.send({
                    "embed": {
                        "description": `${playersWhoseTurn.guildMember.displayName} has Uno!`,
                        "author": {
                            "name": `Uno Game in #${txtchannel.name} (${txtchannel.guild.name}):`,
                            "url": "https://discordapp.com",
                            "icon_url": txtchannel.guild.iconURL()
                        }
                    }
                });
            }
            else {
                await txtchannel.send({
                    "embed": {
                        "description": `${playersWhoseTurn.guildMember.displayName} has **${playersWhoseTurn.currentDeck.length}** cards left`,
                        "author": {
                            "name": `Uno game in #${txtchannel.name} (${txtchannel.guild.name})`,
                            "icon_url": txtchannel.guild.iconURL()
                        }
                    }
                });
            }
            console.log("TOP OF DECK AT END IS " + curGame.TopCard.name);
        }
    }
}

function getCardFromName(name) {
    //this is not gonna be pretty
    if (name.match(/WildCard$/g)) {
        return new UnoCard("Red", "WildCard");
    }
    else if (name.match(/DrawFour$/g)) {
        return new UnoCard("Red", "DrawFour");
    }
    else {
        var colorOfCard;
        var typeOfCard;
        for (var i = 0; i < 4; i++) {
            const CRE = new RegExp("^"+UnoColors[i],"g");
            var v = CRE.exec(name);
            //console.log(v);
            if (v) {
                if (UnoColors.includes(v[0])) {
                    colorOfCard = v[0];
                }
            }
            const TRE = new RegExp("^"+UnoColors[i]+"(\\w+)$","g");
            let d = TRE.exec(name);
            //console.log(d);
            if (d) {
                typeOfCard = d[1];
            }
        }
        console.log("line 379: " + colorOfCard);
        return new UnoCard(colorOfCard, typeOfCard);
    }
}

//                  TextChannel, GuildMember, Array<UnoCard>, UnoCard
async function sendDM(channel, mem, cardDeck, current) {
    var deck = "";
    for (var i = 0; i < cardDeck.length; i++) {
        deck += ("**" + (i + 1)+ ")** " + ((cardDeck[i].type == "WildCard" || cardDeck[i].type == "DrawFour") ? (cardDeck[i].type) : (cardDeck[i].color + " " + cardDeck[i].type))+ "\n");
    }
    var embed = {
        "embed": {
          "color": getHexFromColor(current.color),
          "author": {
            "name": `Your cards in #${channel.name} (${channel.guild}):`,
            "url": "https://discordapp.com",
            "icon_url": channel.guild.iconURL()
          },
          "image": {
            "url": `https://cdn.discordapp.com/emojis/${CardImageIDs[current.name]}.png?v=1`
          },
          "description": deck,
          "footer": {
              "text": "Please wait for reactions to load before selecting."
          },
          "fields": [
            {
              "name": "Current Card Played",
              "value": `${current.color} ${current.type}`
            }
          ]
        }
      };
    var msgID = await mem.send(embed)
        .then(async function(message) {
            //const filter = (reaction, user) => 
            for (i = 0; i < cardDeck.length; i++) {
                let reactionCard = cardDeck[i];
                await message.react(bot.guilds.cache.get(getServerIDFromUnoCard(reactionCard)).emojis.cache.get(CardImageIDs[reactionCard.name]));
                if (i >= 18) {
                    break;
                }
            }
            await message.react(bot.guilds.cache.get("362793546908172309").emojis.cache.get("614932200588181520"));
            return message.id;
        })
        .catch(console.error);
    return msgID;
}

function getServerIDFromUnoCard(unoCrd) {
    if (unoCrd.name == "YellowSkip" 
        || unoCrd.name == "YellowReverse" 
        || unoCrd.name == "WildCard" 
        || unoCrd.name == "DrawFour") {
        return "362793546908172309";
    }
    else {
        return "611431492135944215";
    }
}
bot.login("");

var CardImageIDs = {
    "Red0": "614574398422384650",
    "Red1": "614582117212356608",
    "Red2": "614582129723965446",
    "Red3": "614582136917458947",
    "Red4": "614582145947795477",
    "Red5": "614582157381468161",
    "Red6": "614582165463630004",
    "Red7": "614582174129193182",
    "Red8": "614582186397401110",
    "Red9": "614582197445197857",
    "RedDrawTwo": "614582206781980687",
    "RedReverse": "614582222996897809",
    "RedSkip":"614582241904820245",
    "Green0": "614582386021236746",
    "Green1": "614582393692618759",
    "Green2": "614582401871380481",
    "Green3": "614582409580773376",
    "Green4": "614582420406272046",
    "Green5": "614582428031516717",
    "Green6": "614582435161702432",
    "Green7": "614582447232778242",
    "Green8": "614582456502190080",
    "Green9": "614582466191294514",
    "GreenDrawTwo": "614582476467339264",
    "GreenReverse": "614582485434761244",
    "GreenSkip":"614582497514356767",
    "Blue0": "614582283860574229",
    "Blue1": "614582290177065001",
    "Blue2": "614582299631026206",
    "Blue3": "614582306824257561",
    "Blue4": "614582313740795967",
    "Blue5": "614582325535309845",
    "Blue6": "614582332405448800",
    "Blue7": "614582338294382603",
    "Blue8": "614582345281961994",
    "Blue9": "614582352361947179",
    "BlueDrawTwo": "614582362252247042",
    "BlueReverse": "614582368837173271",
    "BlueSkip":"614582374709198854",
    "Yellow0": "614582534520569890",
    "Yellow1": "614582547099418645",
    "Yellow2": "614582576559947798",
    "Yellow3": "614582589411426305",
    "Yellow4": "614582600178204682",
    "Yellow5": "614582612492550144",
    "Yellow6": "614582622206558227",
    "Yellow7": "614582633757671444",
    "Yellow8": "614582644025589774",
    "Yellow9": "614582654372806738",
    "YellowDrawTwo": "614582673368678410",
    "YellowReverse": "614582745846382674",
    "YellowSkip":"614582754159362088",
    "WildCard": "614582769678418143",
    "DrawFour": "614582761407250455",
    "Draw": "614932200588181520",
};