//プレーヤーのクラス
import { Card } from "./card.js";

export class Player{
    constructor(id) {
        this.id = id;
        this.name = ""; // プレイヤー名
        this.socketId = null; // ソケットID
        this.type = ""; // host, robot, remote
        this.position_x = 0; // プレイヤーのX座標
        this.position_y = 0; // プレイヤーのY座標
        this.myCards = [];
        this.myCardsObj = []; // プレイヤーのカードオブジェクト
        this.status = "waiting"; // waiting, playing, gameover
        this.textObj = null; // プレイヤーのテキストオブジェクト
        this.idObj = null; // プレイヤーのIDオブジェクト
        this.playOrder = 0; // プレイヤーの出番
        this.identity = null; // プレイヤーの役職
    }

    // プレーヤのカード情報を取得
    getMyCards() {
        let cards = [];
        this.myCards.forEach(card => {
            cards.push({key: card.key, type: card.type, pointValue: card.pointValue });
        });
        return cards;
    }

    // プレーヤのカード情報を更新(カードオブジェクトをクラスに変換)
    updateMyCardsFromObj() {
        this.myCardsObj.forEach((card, index) => {
            this.myCards[index] = new Card(card.key, card.type, card.pointValue);
        });
    }
}