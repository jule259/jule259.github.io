// カードのクラス
export class Card {
    constructor(key, type, pointValue) {
        this.key = key; // カードの種類（例：スペード、ハート）
        this.type = type; // カードのタイプ（例：スペード、ハート）
        this.pointValue = pointValue; // カードのポイント値
    }
}
