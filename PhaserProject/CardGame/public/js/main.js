import * as CONSTS from './const.js';
import { startGame } from './game.js';
import { getSocket, getMyPlayerID, setMyPlayerID } from './ClientCommon.js';

const config = {
    type: Phaser.AUTO,
    backgroundColor: "#192a56",
    width: 1920,
    height: 1080,
    parent: "game",
    scene: {
        preload: preload,
        create: create
    },
    scale: {
        mode: Phaser.Scale.FIT, // 画面のサイズに合わせて拡大縮小
        autoCenter: Phaser.Scale.CENTER_BOTH // ゲームを画面の中央に配置
    }
};


var game = new Phaser.Game(config);

function preload ()
{
    //カードの正面
    CONSTS.cardResourse.forEach((card) => {
        this.load.image(card.key, card.path);
    });

    //カードの裏面
    this.load.image("card_back_blue", "assets/card_back_blue.png");
    this.load.image("card_back_green", "assets/card_back_green.png");

    //ボタン
    this.load.image("button_ok", "assets/button_ok.png");

}

function create ()
{
    // 共通socketを取得
    const socket = getSocket();
    socket.on('connect', () => {
        console.log('Connected to server with ID:', socket.id);
        // プレイヤーを追加するイベントをサーバに送信
        socket.emit("addPlayer");
        // ロボットプレイヤーを追加するイベントをサーバに送信(仮で2体追加)
        socket.emit("addRobotPlayer"); // ロボットプレイヤーを追加
        socket.emit("addRobotPlayer"); // ロボットプレイヤーを追加
    });
    socket.on('playerAdded', (playerID) => {
        setMyPlayerID(playerID); // プレイヤーIDを保存
        console.log("Player added with ID:", getMyPlayerID());
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
    //             startGame(this);
    //         }
    //     })
    // });

    startGame(this);

}

