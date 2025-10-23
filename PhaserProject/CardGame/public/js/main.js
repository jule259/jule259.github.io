import * as CONSTS from './const.js';
import * as GMFUNC from './game.js';
import * as CMFUNC from './ClientCommon.js';

const config = {
    type: Phaser.AUTO,
    backgroundColor: "#192a56",
    width: 1920,
    height: 1080,
    parent: "game",
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.FIT, // 画面のサイズに合わせて拡大縮小
        autoCenter: Phaser.Scale.CENTER_BOTH // ゲームを画面の中央に配置
    }
};

//var gameStatus = CONSTS.gameStatus.WAITING_FOR_START; // ゲームの初期状態を設定


var game = new Phaser.Game(config);

function preload ()
{
    //カードの正面
    CONSTS.CARD_RESOURCE.forEach((card) => {
        this.load.image(card.key, card.path);
    });

    //カードの裏面
    this.load.image("card_back_blue", "assets/card_back_blue.png");
    this.load.image("card_back_green", "assets/card_back_green.png");

    //ボタン
    //this.load.image("button_ok", "assets/button_ok.png");
    this.load.image("tick_blue", "assets/tick_blue.png");
    this.load.image("cancel_grey", "assets/cancel_grey.png");

}

function create ()
{
    // シーンオブジェクトを保存
    CMFUNC.setScene(this);

    // ゲームフィールドの作成
    GMFUNC.createField();

    // 「waiting for players」を表示
    GMFUNC.showWaitingForPlayers();

    // 共通socketを取得
    const socket = CMFUNC.getSocket();
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        let playerCount = CMFUNC.getPlayers().length;
        if (playerCount === 0) {// プレーヤーがいない場合、プレイヤーを追加する
            // プレイヤーを追加するイベントをサーバに送信
            socket.emit("addPlayer");
            // ロボットプレイヤーを追加するイベントをサーバに送信(仮で2体追加)
            // socket.emit("addRobotPlayer"); // ロボットプレイヤーを追加
            // socket.emit("addRobotPlayer"); // ロボットプレイヤーを追加
        }
    });
    socket.on('playerAdded', (playerID) => {
        CMFUNC.setMyPlayerID(playerID); // プレイヤーIDを保存
        console.log("Player added with ID:", CMFUNC.getMyPlayerID());
    });

    //メニュー画面
    // const titleText = this.add.text(this.sys.game.scale.width / 2, this.sys.game.scale.height / 2,
    //     "Card Game\nClick to Play",
    //     { align: "center", strokeThickness: 4, fontSize: 40, fontStyle: "bold", color: "#8c7ae6" }
    // )
    //     .setOrigin(.5)
    //     .setDepth(3)
    //     .setInteractive();
    // this.add.tween({
    //     targets: titleText,
    //     duration: 800,
    //     ease: (value) => (value > .8),
    //     alpha: 0,
    //     repeat: -1,
    //     yoyo: true,
    // });
    // //タイトルのイベント
    // titleText.on(Phaser.Input.Events.POINTER_OVER, () => {
    //     titleText.setColor("#9c88ff");
    //     this.input.setDefaultCursor("pointer");
    // });
    // titleText.on(Phaser.Input.Events.POINTER_OUT, () => {
    //     titleText.setColor("#8c7ae6");
    //     this.input.setDefaultCursor("default");
    // });
    // titleText.on(Phaser.Input.Events.POINTER_DOWN, () => {
    //     this.add.tween({
    //         targets: titleText,
    //         ease: Phaser.Math.Easing.Bounce.InOut,
    //         y: -1000,
    //         onComplete: () => {
    //             GMFUNC.startGame(this);
    //         }
    //     })
    // });

    // デッキ情報を取得
    socket.on('deckInfo', (deck) => {
        // サーバのデッキ情報を基にデッキを作成する
        console.log("Deck received from server:", deck);
        GMFUNC.createDeck(deck);
        //console.log("Deck created with cards:", deckData);
        GMFUNC.shuffleDeck(); // デッキをシャッフル(アニメーションのみ)
    });

    socket.on('cardsDrawn', (data) => {
        // クライアントに引いたカードを表示する処理
        console.log("Cards drawn from server:", data);
        let playerID = data.playerId;
        let drawnCards = data.drawnCards;
        let players = CMFUNC.getPlayers();
        let player = players.find(p => p.id === playerID);
        if (player) {
            // プレイヤーの手札に引いたカードを追加
            GMFUNC.drawCard(drawnCards.length, player, 0, drawnCards);
        } else {
            console.error(`Player with ID ${playerID} not found.`);
        }
    });

    socket.on("allPlayerInfo", (data) => {
        if(CMFUNC.getPlayers().length === 0) {//プレイヤー情報設定されていない場合
            GMFUNC.initPlayerInfo(data);
        } else {//プレイヤー情報が設定されている場合
            GMFUNC.updatePlayerInfo(data);
        }
    });

    socket.on("updateLastUsedCards", (data) => {
        // 出したカードの情報を更新
        console.log("Last used cards updated:", data);
        GMFUNC.updateLastUsedCards(data);
    });

    socket.on("gameReset", () => {
        console.log("Game reset received from server");
        GMFUNC.resetGame();
        // gameStatus = CONSTS.gameStatus.WAITING_FOR_START;
    });

    // socket.on("updatePlayersStatus", (data) => {
    //     console.log("Player status updated:", data);
    //     GMFUNC.updatePlayersStatus(data);
    // });

    //キーボードの「R」キー押下時ロボットプレイヤーを追加
    this.input.keyboard.addKey("R").on("down", () => {
        const playerCount = CMFUNC.getPlayers().length;
        console.log("Adding robot player, current player count:", playerCount);
        if (playerCount < 3) { // 最大3人までロボットプレイヤーを追加
            socket.emit("addRobotPlayer"); // ロボットプレイヤーを追加
            console.log("Robot player added");
        } else {
            console.log("Maximum number of players reached");
        }
    });

    //キーボードの「O」キー押下時ゲームをリセット
    this.input.keyboard.addKey("O").on("down", () => {
        console.log("Resetting game");
        socket.emit("resetGame"); // ゲームをリセット
    });

    socket.on("startGame", () => {
        GMFUNC.removeWaitingForPlayers(); // 「waiting for players」を削除
        //gameStatus = CONSTS.gameStatus.GAME_STARTED;
        GMFUNC.startGame();
    });

    // 非同期でゲーム開始を待つ
    // GMFUNC.waitingForStartGame(this).then(() => {
    //     // サーバーからstartGameイベントが送られたときの処理
    //     gameStatus = CONSTS.gameStatus.GAME_STARTED;
    //     GMFUNC.startGame(this);
    // });

}

function update ()
{
}

