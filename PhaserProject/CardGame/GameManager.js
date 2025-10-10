//サーバでゲームを管理するクラス
import * as CONSTS from './public/js/const.js';
import { Player } from './public/js/player.js';
export class GameManager {
    constructor() {
        this.deck = []; // ゲームのデッキ
        this.players = [];
        this.gameState = {};
        this.hostPlayerID = ""; // ホストプレイヤーのID
        this.hostSocketId = ""; // ホストプレイヤーのソケットID
        this.isShuffled = false; // デッキがシャッフルされたかどうか
        this.lastUsedCards =[]; // 最後に出したカードを格納する配列
        this.playOrder = []; // プレイヤーの出番順
        this.playingPlayerIndex = 0; // 現在のプレイヤーのインデックス
    }

    addPlayer(playerID, socketId) {
        let newplayer = new Player(playerID);
        if (this.players.length === 0) {
            newplayer.type = "host"; // 最初のプレイヤーはホスト
            newplayer.status = "playing"; // ホストプレイヤーのステータスをplayingに設定
            this.hostPlayerID = playerID; // ホストプレイヤーのIDを保存
            this.hostSocketId = socketId; // ホストプレイヤーのソケットIDを保存
        }
        newplayer.socketId = socketId; // ソケットIDを設定
        newplayer.identity = CONSTS.playerType.CIVILIAN; // 初期の役職をCIVILIANに設定
        this.players.push(newplayer);
        this.updateGameState();
    }

    addRobotPlayer(playerID) {
        let newRobotPlayer = new Player(playerID);
        newRobotPlayer.type = "robot"; // ロボットプレイヤーとして設定
        newRobotPlayer.socketId = ""; // ロボットプレイヤーのソケットIDは空固定
        newRobotPlayer.identity = CONSTS.playerType.CIVILIAN; // 初期の役職をCIVILIANに設定
        this.players.push(newRobotPlayer);
        this.updateGameState();
    }

    updatePlayerCards(playerId, myCards) {
        let player = this.players.find(player => player.id === playerId);
        if (player) {
            player.myCards = myCards; // プレイヤーのカードを更新
            this.updateGameState();
        } else {
            console.error(`Player with ID ${playerId} not found.`);
        }
    }

    removePlayer(playerId) {
        this.players = this.players.filter(player => player.id !== playerId);
        this.updateGameState();
    }

    removePlayerBySocketId(socketId) {
        this.players = this.players.filter(player => player.socketId !== socketId);
        this.updateGameState();
    }

    updateGameState() {
        // ゲームの状態を更新するロジック
        // this.gameState = {
        //     players: this.players.map(player => player.getInfo()),
        //     // 他のゲーム状態情報
        // };
    }

    getGameState() {
        return this.gameState;
    }

    initGame() {
        //this.players = [];
        this.gameState = {};
        this.hostPlayerID = "";
        this.hostSocketId = "";
        this.deck = this.createDeck(); // デッキを初期化
        this.shuffleDeck(); // デッキをシャッフル
    }

    resetGame() {
        this.players.forEach(player => {
            player.myCards = []; // 各プレイヤーの手札を空にする
        });
        this.lastUsedCards = []; // 最後に出したカードを空にする
        this.deck = this.createDeck(); // デッキを初期化
        this.shuffleDeck(); // デッキをシャッフル
        this.randomIdentities();// プレイヤーの役職をランダムで設定
        this.determinePlayOrder(); // プレイヤーの出番を決定
    }

    startGame() {
        console.log("Game started");
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]; // 配列の要素を交換
        }
    }

    createDeck() {
        //メモリのコピー
        return JSON.parse(JSON.stringify(CONSTS.cardResource));
    }

    playerDrawCard(io, playerId, drawNum) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            const drawnCards = [];
            for (let i = 0; i < drawNum; i++) {
                const card = this.deck.pop(); // デッキからカードを引く
                drawnCards.push(card);
                player.myCards.push(card); // プレイヤーの手札に追加
            }
            io.emit("cardsDrawn", {playerId: playerId, drawnCards: drawnCards}); // クライアントに引いたカードを送信
            console.log(`Player ${playerId} drew ${drawNum} cards.`);
            this.updateGameState();
        } else {
            console.error(`Player with ID ${playerId} not found.`);
        }
    }

    //プレーヤの役職をランダムに決定する
    randomIdentities() {
        //全員の中、一人がlandlord、残りがcivilian
        if (this.players.length === 0) {
            console.error("No players to assign identities.");
            return;
        }
        //（仮）ホストプレイヤーを地主に設定
        const hostPlayer = this.players.find(p => p.id === this.hostPlayerID);
        if (hostPlayer) {
            hostPlayer.identity = CONSTS.playerType.LANDLORD;
        }
        const landlordIndex = this.players.indexOf(hostPlayer);

        // const landlordIndex = Math.floor(Math.random() * this.players.length);
        this.players[landlordIndex].identity = CONSTS.playerType.LANDLORD;
        this.players.forEach((player, index) => {
            if (index !== landlordIndex) {
                player.identity = CONSTS.playerType.CIVILIAN;
            }
        });
    }

    //プレイヤーの出番を決定する
    determinePlayOrder() {
        for (let i = 0; i < this.players.length; i++) {
            this.playOrder.push(this.players[i].id);
            if (this.players[i].identity === CONSTS.playerType.LANDLORD) {
                this.playingPlayerIndex = i; // 最初の出番を地主に設定
                this.players[i].status = "playing"; // 地主のステータスをplayingに設定
            } else {
                this.players[i].status = "waiting"; // 他のプレイヤーのステータスをwaitingに設定
            }
        }
    }

    //次のプレイヤーに交代する
    advanceToNextPlayer(io) {
        if (this.playOrder.length === 0) {
            console.error("Play order is not set.");
            return;
        }
        this.playingPlayerIndex = (this.playingPlayerIndex + 1) % this.playOrder.length;
        // 全プレイヤーのステータスを更新
        this.players.forEach(player => {
            if (player.id === this.playOrder[this.playingPlayerIndex]) {
                player.status = "playing";
            } else {
                player.status = "waiting";
            }
        });
        // 全プレイヤーの情報を送信
        io.emit("allPlayerInfo", JSON.stringify(this.players));
    }

    /******未使用 *****/
    
    //出せるカードを取得する
    //戻り値：出せるカードの配列 => []
    getPlayableCards(cards) {
        if (cards.length === 0) {
            return [];
        }
        // if(lastUsedCards.length === 0) {
        //     return "any"
        // }
        let cardInfo = countCardsInfo(cards);

        //手札のカードが出せる全てのタイプを配列に格納
        let playableType = [];

        //single
        playableType.push("single");

        let straight_count = 1;
        Object.keys(cardInfo.cardsInfoArr).forEach((key) => {
            let nextkey = Number(key) + 1;
            let nextnextkey = Number(key) + 2;
            //pair
            if (cardInfo.cardsInfoArr[key] === 2) {
                playableType.push("pair");
                //joker bomb
                if (key === 98 && nextkey === 99) {
                    playableType.push("joker_bomb");
                }
                //tripple straight pair
                if ((nextkey in cardInfo.cardsInfoArr && cardInfo.cardsInfoArr[nextkey] === 2) &&
                    (nextnextkey in cardInfo.cardsInfoArr && cardInfo.cardsInfoArr[nextnextkey] === 2)) {
                    playableType.push("tripple_pair");
                }
            }
            //three
            if (cardInfo.cardsInfoArr[key] === 3) {
                playableType.push("pair");
                playableType.push("three");
                if (cards.length > 3) {
                    playableType.push("three_with_single");
                }
                //double three
                if (nextkey in cardInfo.cardsInfoArr && cardInfo.cardsInfoArr[nextkey] === 3) {
                    playableType.push("double_three");
                }
            }
            //bomb
            if (cardInfo.cardsInfoArr[key] === 4) {
                playableType.push("pair");
                playableType.push("three");
                playableType.push("bomb");
            }
            //straight
            if (cardInfo.cardsInfoArr[Number(key)] >= 1 && cardInfo.cardsInfoArr[nextkey] >= 1) {//連続している場合
                if (Number(key) < 14) {//14以上のカードはストレートに含めない
                    straight_count++;
                }
                if (straight_count >= 5) {
                    playableType.push("straight_for_" + straight_count);
                }
            } else {
                straight_count = 1;
            }
        });
        Object.keys(cardInfo.cardsInfoArr).forEach((key) => {
            if (cardInfo.cardsInfoArr[key] === 2) {
                //three with pair
                if (cardInfo.maxSameCardCount === 3 && cardInfo.maxSameCardValue !== key) {
                    playableType.push("three_with_pair");
                }
                //bomb with pair
                if (cardInfo.maxSameCardCount === 4 && cardInfo.maxSameCardValue !== key) {
                    playableType.push("bomb_with_pair");
                }
            }
        });

        //重複を削除
        playableType = [...new Set(playableType)];
        return playableType;
    }

    //カードの統計情報を取得
    countCardsInfo(cards) {
        let maxSameCardValue = 0;
        let maxSameCardCount = 0;
        let cardsInfo = {};
        let cardsInfoArr = {};
        cards.forEach((card) => {
            if (cardsInfoArr[card.pointValue]) {// 既に存在するカードの場合
                cardsInfoArr[card.pointValue] += 1;
            } else {// 新しいカードの場合
                cardsInfoArr[card.pointValue] = 1;
            }
            if (cardsInfoArr[card.pointValue] >= maxSameCardCount) {// 最大の同じカード数を更新
                maxSameCardCount = cardsInfoArr[card.pointValue];
                maxSameCardValue = card.pointValue;
            }
        });
        cardsInfo.maxSameCardValue = maxSameCardValue;
        cardsInfo.maxSameCardCount = maxSameCardCount;
        cardsInfo.cardsInfoArr = cardsInfoArr;
        return cardsInfo;
    }

    //カードのタイプを取得
    getCardType(cards) {
        let cardType = "";

        let cardsInfo = countCardsInfo(cards);

        if (cards.length === 1) {
            //single
            cardType = "single";
        } else if (cards.length === 2) {
            //pair
            if (cards[0].pointValue === cards[1].pointValue) {
                cardType = "pair";
            }
            //joker bomb
            if (cards[0].pointValue === 98 && cards[1].pointValue === 99) {
                cardType = "joker_bomb";
            }
        } else if (cards.length === 3) {
            //three
            if (cards[0].pointValue === cards[1].pointValue && cards[0].pointValue === cards[2].pointValue) {
                cardType = "three";
            }
        } else if (cards.length === 4) {
            //three with single
            if (cardsInfo.maxSameCardCount === 3) {
                cardType = "three_with_single";
            }

            //bomb
            if (cards[0].pointValue === cards[1].pointValue && cards[0].pointValue === cards[2].pointValue && cards[0].pointValue === cards[3].pointValue) {
                cardType = "bomb";
            }
        } else if (cards.length >= 5) {
            if (cards.length === 5) {
                //three with pair
                if (cardsInfo.maxSameCardCount === 3) {
                    cards.forEach((card) => {
                        if (card.pointValue !== cardsInfo.maxSameCardValue) {
                            if (cardsInfo.cardsInfoArr[card.pointValue] === 2) {
                                cardType = "three_with_pair";
                            }
                        }
                    });
                }
            }
            if (cards.length === 6) {
                //bomb with pair
                if (cardsInfo.maxSameCardCount === 4) {
                    cards.forEach((card) => {
                        if (card.pointValue !== cardsInfo.maxSameCardValue) {
                            if (cardsInfo.cardsInfoArr[card.pointValue] === 2) {
                                cardType = "bomb_with_pair";
                            }
                        }
                    });
                }
                //tripple staright pair
                if (cardsInfo.maxSameCardCount === 3) {
                    let isStraight = false;
                    Object.keys(cardsInfo.cardsInfoArr).forEach((key) => {
                        if (cardsInfo.cardsInfoArr[key] == 3 && cardsInfo.cardsInfoArr[Number(key) + 1] == 3 && cardsInfo.cardsInfoArr[Number(key) + 2] == 3) {
                            isStraight = true;
                        }
                    });
                    if (isStraight) {
                        cardType = "tripple_pair";
                    }
                }
                //double three
                if (cardsInfo.maxSameCardCount === 3) {
                    let isDouble = false;
                    Object.keys(cardsInfo.cardsInfoArr).forEach((key) => {
                        if (cardsInfo.cardsInfoArr[key] == 3 && cardsInfo.cardsInfoArr[Number(key) + 1] == 3) {
                            isDouble = true;
                        }
                    });
                    if (isDouble) {
                        cardType = "double_three";
                    }
                }

            }
            //straight
            if (cardType == "") {//カードのタイプが不明の場合
                for (let i = 0; i < cards.length - 1; i++) {
                    if ((cards[i].pointValue !== cards[i + 1].pointValue - 1) || (cards[i].pointValue > 14)) {//連続していない場合、不明
                        return "";
                    }
                }
                cardType = "straight_for_" + cards.length;
            }
        } else {
            //不明
        }
        return cardType;
    }
}