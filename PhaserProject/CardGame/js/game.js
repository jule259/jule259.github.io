import * as CONSTS from './const.js';

let lastUsedCard = null; // 最後に出したカード
let lastUsedCards =[]; // 最後に出したカードを格納する配列
let okBtn = null; // OKボタン
let deckData = []; // デッキのカードを格納する配列
// let usedCards = []; // 出したカードの配列
let myCards = []; // 手札を格納する配列
let selectedCards = []; // 選択したカードの配列
let usedCardsLayer = null; // 最後に出したカードを表示するレイヤー
let gameOver = false;
//手札カードフィルド
let myCardField = {
    x : 200,
    y : 600,
    width : 200,
    height : 145,
}

class Player{
    constructor(id) {
        this.id = id;
        this.deck = [];
        this.myCards = [];
        this.isMyturn = false;
    }

}

export function startGame(scene){
    //フィールドを作成
    createField(scene);

    //デッキを作成
    createDeck(scene);

    //デッキをシャッフル
    shuffleDeck(scene, () => {
        //シャッフル完了後、カードを5枚まで引く
        drawCard(scene, 13);
    });
}

//カードを引く
//scene：シーン
//drawNum：引く枚数 
//戻り値：なし
export function drawCard(scene ,drawNum , nowNum = 0){
    if (nowNum >= drawNum) {//ドロー終了
        //手札をソート
        sortCard(myCards, "pointValue", "asc");
        //手札の位置を再調整する
        adjustMyCardPosition(scene);
        return;
    }

    //引く枚数より、手札フィルドの幅を計算
    let myCardFiledWidth = myCards.length * CONSTS.cardInfo.width ;//手札フィールドの幅

    //手札フィールドの開始座標（x座標）
    let myCardFieldStartX = scene.cameras.main.width / 2 - myCardFiledWidth / 2;

    //デッキのカードを引く
    let card = deckData.pop();
    if (!card) {
        console.log("デッキが空です");
        return;
    }

    //カードを最前面に移動
    scene.children.bringToTop(card);

    //カードを手札に移動する時のX座標を計算(現在手札の一番右のカードのX座標 + 100)
    let targetX = myCardFieldStartX + CONSTS.cardInfo.width * (myCards.length);

    //カードの正面を表示
    card.setTexture(card.key);

    // カードを引いたときのアニメーション
    scene.tweens.add({
        targets: card,
        x: targetX, // 目標のX座標
        y: myCardField.y, // 目標のY座標
        ease: 'Power2', // イージング
        duration: 100, // 移動にかける時間（ミリ秒）
        onComplete: () => {// 移動完了後に実行される処理
            // カード作成
            createCard(scene, card);

            //手札のカードの位置を再調整する
            adjustMyCardPosition(scene);

            //再帰処理
            drawCard(scene, drawNum, nowNum + 1);
        },
    });
}

//手札のカードの位置を再調整する
export function adjustMyCardPosition(scene, cb = null){
    if  (myCards.length === 0) {
        //ボタンを作成（削除）
        createButton(scene);
        return;
    }

    //手札フィールドの幅を計算
    let myCardFiledWidth = myCards.length * CONSTS.cardInfo.width;
    //手札フィールドの開始座標（x座標）
    let myCardFieldStartX = scene.cameras.main.width / 2 - myCardFiledWidth / 2;
    //手札フィルド属性を更新
    myCardField.x = myCardFieldStartX;
    myCardField.width = myCardFiledWidth;

    for (let i = 0; i < myCards.length; i++) {
        let targetX = myCardFieldStartX + CONSTS.cardInfo.width * i;

        // カードを引いたときのアニメーション
        scene.tweens.add({
            targets: myCards[i],
            x: targetX, // 目標のX座標
            y: myCardField.y, // 目標のY座標
            ease: 'Power2', // イージング
            duration: 500, // 移動にかける時間（ミリ秒）
            onComplete: () => {// 移動完了後に実行される処理
                //全てのアニメーションが終了したら
                if ((i === myCards.length - 1)) {
                    //ボタンを作成
                    createButton(scene);
                    //コールバック関数を実行
                    if (cb) {
                        cb();
                    }
                }
            },
        });
    }
}

//カード作成
export function createCard(scene, card) {
    //カスタムプロパティ
    card.originalY = card.y;// 元のY座標
    card.isSelect = false;// 選択状態
    card.showNo = myCards.length + 1;// 手札の表示番号

    //カードをインタラクティブに設定
    card.setInteractive();

    //マウスがカードに触れたときのイベント
    card.on('pointerover', () => {
        card.y = card.originalY - 20; // 少し上に移動
    });

    //マウスがカードから離れたときのイベント
    card.on('pointerout', () => {
        if (!card.isSelect) {// 選択されていない場合
            card.y = card.originalY; // 元の位置に戻す
        }
    });

    //カードをクリックしたときのイベント
    card.on('pointerdown', () => {
        card.isSelect = !card.isSelect; // 選択状態を反転
        //選択されたカードを配列に追加
        if (card.isSelect) {
            selectedCards.push(card);
        } else {//選択解除
            selectedCards = selectedCards.filter((c) => c !== card);
        }
    });

    // 手札に追加
    myCards.push(card);
    return card;
}

//カードをソートする
export function sortCard(cards, sortkey, sortType = "asc") {
    //ソート
    cards.sort((a, b) => {
        if (sortType === "asc") {
            return a[sortkey] - b[sortkey];
        } else {
            return b[sortkey] - a[sortkey];
        }
    });
    //表示番号を再設定
    for (let i = 0; i < cards.length; i++) {
        cards[i].showNo = i + 1;
    }
    return cards;
}

//カードを出す
export function playCard(scene){
    if (selectedCards.length === 0) {
        return;
    }
    //選択されたカードをソート
    sortCard(selectedCards, "showNo", "asc");

    //カードを出せるかをチェック
    if (!playCheck(selectedCards)) {
        console.log("出せません");
        //console.log(selectedCards);
        return;
    }
    // フィールド内のランダムな位置に移動
    let targetX = Phaser.Math.Between(
        CONSTS.usedCardField.x + CONSTS.cardInfo.width, //左余白
        CONSTS.usedCardField.x + CONSTS.usedCardField.width - selectedCards.length * CONSTS.cardInfo.width //右余白
    );
    let targetY = Phaser.Math.Between(
        CONSTS.usedCardField.y + 120, //上余白
        CONSTS.usedCardField.y + CONSTS.usedCardField.height - 120 //下余白
    );


    lastUsedCards = [];
    //選択されたカードを出す
    for (let i = 0; i < selectedCards.length; i++) {
        let card = selectedCards[i];
        //カードの画像を最前面に移動
        scene.children.bringToTop(card);

        // //出したカードを配列に追加
        // usedCards.push(card);

        //手札から削除
        myCards = myCards.filter((c) => c !== card);

        //カードのイベントを無効化
        card.disableInteractive();

        //アニメーションを追加
        scene.tweens.add({
            targets: card,
            x: targetX + i * CONSTS.cardInfo.width, //目標のX座標
            y: targetY, //目標のY座標
            ease: 'Power2', //イージング
            duration: 500, //移動にかける時間（ミリ秒）
            onComplete: () => {//移動完了後に実行される処理
                //最後に出したカードを最新カードフィルドに設定
                lastUsedCard = scene.add.image(CONSTS.lastUsedCardField.x + CONSTS.lastUsedCardField.width / 2, CONSTS.lastUsedCardField.y + CONSTS.lastUsedCardField.height / 2, card.key).setScale(0.2);
                lastUsedCard.showNo = card.showNo;//表示番号
                lastUsedCard.pointValue = card.pointValue;//カードの値
                //最後に出したカードの配列に追加(複製して格納)
                lastUsedCards.push(lastUsedCard);
                if (i === selectedCards.length - 1) {
                    //表示操作用カードを追加
                    lastUsedCard = scene.add.image(CONSTS.lastUsedCardField.x + CONSTS.lastUsedCardField.width / 2, CONSTS.lastUsedCardField.y + CONSTS.lastUsedCardField.height / 2, card.key).setScale(0.2);
                    //最後に出したカードのイベントを設定
                    lastUsedCard.setInteractive();
                    lastUsedCard.on('pointerover', () => {//マウスがカードに触れたときのイベント
                        //最後の一回で出した全てのカードをポップアップで表示
                        lastUsedCards.forEach((lcard) => {
                            lcard.originalX = lcard.x;
                            lcard.originalY = lcard.y;
                            let cardWidth = lastUsedCards.length * CONSTS.cardInfo.width;
                            //カードの横位置を調整（アニメーション）
                            scene.tweens.add({
                                targets: lcard,
                                x: (scene.cameras.main.width / 2 - cardWidth / 2) + CONSTS.cardInfo.width / 2 + CONSTS.cardInfo.width * (lcard.showNo - 1),
                                y: CONSTS.lastUsedCardField.y + CONSTS.lastUsedCardField.height / 2,
                                ease: 'Power2',
                                duration: 100,
                            });
                        });
                    });
                    lastUsedCard.on('pointerout', () => {//マウスがカードから離れたときのイベント
                        //カードを元の位置に戻す(アニメーション）
                        lastUsedCards.forEach((lcard) => {
                            scene.tweens.add({
                                targets: lcard,
                                x: lcard.originalX,
                                y: lcard.originalY,
                                ease: 'Power2',
                                duration: 100,
                            });
                        });
                    });

                    //手札位置を再調整
                    adjustMyCardPosition(scene);
                    //選択されたカードをリセット
                    selectedCards = [];

                    console.log("出したカードのタイプ：" + getCardType(lastUsedCards));
                    console.log(lastUsedCards);
                    
                }
            },
        });
    }


}

//カードのタイプを取得
export function getCardType(cards){
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
        //double pair
        // if (cards[0].pointValue === cards[1].pointValue && cards[2].pointValue === cards[3].pointValue) {
        //     cardType = "double_pair";
        // }

        //bomb
        if (cards[0].pointValue === cards[1].pointValue && cards[0].pointValue === cards[2].pointValue && cards[0].pointValue === cards[3].pointValue) {
            cardType = "bomb";
        }

        //straight pair
        if (cards[0].pointValue === cards[1].pointValue && cards[2].pointValue === cards[3].pointValue && cards[0].pointValue === (cards[2].pointValue - 1) && cards[2].pointValue <= 14 ) {
            cardType = "straight_pair";
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
                let isStraight = true;
                for (let i = 0; i < cards.length - 1; i++) {
                    if ((cards[i].pointValue !== cards[i + 1].pointValue - 1) || (cards[i].pointValue > 14)) {
                        isStraight = false;
                        break;
                    }
                }
                ardType = "tripple_pair";
                
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

//カードを出せるかをチェック
export function playCheck(cards){
    const arrBombType = ["bomb", "joker_bomb"];
    //枚数が一番多いカードの値と数を取得
    let cardsInfo = countCardsInfo(cards);
    let lastUsedCardsInfo = countCardsInfo(lastUsedCards);

    let cardsType = getCardType(cards);
    if (cardsType === "") {//カードのタイプが不明の場合、出せない
        console.log("カードのタイプが不明です");
        return false;
    }
    if (lastUsedCards.length === 0) {//最初の出し手の場合、出せる
        return true;
    }
    let lastUsedCardsType = getCardType(lastUsedCards);
    if ($.inArray(cardsType, arrBombType) == -1 && cardsType !== lastUsedCardsType) {//爆弾以外、かつカードのタイプが異なる場合、出せない
        console.log("カードのタイプが異なります");
        return false;
    }
    if ($.inArray(cardsType, arrBombType) != -1) {//爆弾の場合、どんなカードでも出せる
        if (lastUsedCardsType !== "bomb"){//前のカードが爆弾でない場合、出せる
            return true;
        } else if (cardsInfo.maxSameCardValue > lastUsedCardsInfo.maxSameCardValue) {//前のカードより大きい場合、出せる
            return true;
        } else {
            return false;
        }
    }

    if (cardsInfo.maxSameCardValue > lastUsedCardsInfo.maxSameCardValue) {//前のカードより大きい場合、出せる
        return true;
    } else {
        return false;
    }
}

//カードの統計情報を取得
export function countCardsInfo(cards){
    let maxSameCardValue = 0;
    let maxSameCardCount = 0;
    let cardsInfo = {};
    let cardsInfoArr = {};
    cards.forEach((card) => {
        if (cardsInfoArr[card.pointValue]) {
            cardsInfoArr[card.pointValue] += 1;
        } else {
            cardsInfoArr[card.pointValue] = 1;
        }
        if (cardsInfoArr[card.pointValue] > maxSameCardCount) {
            maxSameCardCount = cardsInfoArr[card.pointValue];
            maxSameCardValue = card.pointValue;
        }
    });
    cardsInfo.maxSameCardValue = maxSameCardValue;
    cardsInfo.maxSameCardCount = maxSameCardCount;
    cardsInfo.cardsInfoArr = cardsInfoArr;
    return cardsInfo;
}

//デッキを作成
export function createDeck(scene){
    //デッキのカードを作成
    let deckField_center_x = CONSTS.deckField.x + CONSTS.deckField.width / 2; //デッキの中心座標（X軸）
    let deckField_center_y = CONSTS.deckField.y + CONSTS.deckField.height / 2; //デッキの中心座標（Y軸）

    CONSTS.cardResourse.forEach((card) => {
        let deckCard = scene.add.image(deckField_center_x, deckField_center_y, "card_back_blue").setScale(0.2);
        deckCard.key = card.key;
        deckCard.pointValue = card.value;
        deckData.push(deckCard);
    });
    //デッキの一番上に背面を表示
    let deckBack = scene.add.image(deckField_center_x, deckField_center_y, "card_back_blue").setScale(0.2).setInteractive();

    //背面のカードをクリックしたときカードを一枚引く
    deckBack.on('pointerdown', () => {
        if (gameOver) {
            return;
        }

        //カードを引く
        drawCard(scene, 1);
    });
}

//デッキをシャッフル
export function shuffleDeck(scene, cb = null){
    Phaser.Utils.Array.Shuffle(deckData);
    //シャッフルのアニメーション(カードをランダムな位置に移動し、デッキの中心に集める)
    for (let i = 0; i < deckData.length; i++) {
        let targetX = Phaser.Math.Between(
            CONSTS.deckField.x + CONSTS.cardInfo.width, //左余白
            CONSTS.deckField.x + CONSTS.deckField.width - CONSTS.cardInfo.width //右余白
        );
        let targetY = Phaser.Math.Between(
            CONSTS.deckField.y + 50, //上余白
            CONSTS.deckField.y + CONSTS.deckField.height - 50 //下余白
        );

        //アニメーションを追加
        scene.tweens.add({
            targets: deckData[i],
            x: targetX, //目標のX座標
            y: targetY, //目標のY座標
            ease: 'Power2', //イージング
            duration: 500, //移動にかける時間（ミリ秒）
            yoyo: true, //リピート
            onComplete: () => {//移動完了後に実行される処理
            //全てのアニメーションが終了したらコールバック関数を実行
                if ((i === deckData.length - 1) && cb) {
                    cb();
                }
            },
        });

    }
}

//フィールドを作成
export function createField(scene){
    //デッキのフィールドを作成
    const deckGraphics = scene.add.graphics();

    //フィールドのデザインを設定
    deckGraphics.fillStyle(0x008000, 0.5); //緑色（RGBAで50%の透明度）
    deckGraphics.fillRect(
        CONSTS.deckField.x,
        CONSTS.deckField.y,
        CONSTS.deckField.width,
        CONSTS.deckField.height
    );

    //フィールドの境界線を描画（任意）
    deckGraphics.lineStyle(2, 0x000000, 1); //黒い線
    deckGraphics.strokeRect(
        CONSTS.deckField.x,
        CONSTS.deckField.y,
        CONSTS.deckField.width,
        CONSTS.deckField.height
    );

    //フィールドを作成
    const fieldGraphics = scene.add.graphics();

    //フィールドのデザインを設定
    fieldGraphics.fillStyle(0x008000, 0.5); //緑色（RGBAで50%の透明度）
    fieldGraphics.fillRect(
        CONSTS.usedCardField.x,
        CONSTS.usedCardField.y,
        CONSTS.usedCardField.width,
        CONSTS.usedCardField.height
    );

    //フィールドの境界線を描画（任意）
    fieldGraphics.lineStyle(2, 0x000000, 1); //黒い線
    fieldGraphics.strokeRect(
        CONSTS.usedCardField.x,
        CONSTS.usedCardField.y,
        CONSTS.usedCardField.width,
        CONSTS.usedCardField.height
    );

    //最後に出したカードのフィールドを作成
    const lastUsedCardFieldGraphics = scene.add.graphics();

    //フィールドのデザインを設定
    lastUsedCardFieldGraphics.fillStyle(0x008000, 0.5); //緑色（RGBAで50%の透明度）
    lastUsedCardFieldGraphics.fillRect(
        CONSTS.lastUsedCardField.x,
        CONSTS.lastUsedCardField.y,
        CONSTS.lastUsedCardField.width,
        CONSTS.lastUsedCardField.height
    );

    //フィールドの境界線を描画（任意）
    lastUsedCardFieldGraphics.lineStyle(2, 0x000000, 1); //黒い線
    lastUsedCardFieldGraphics.strokeRect(
        CONSTS.lastUsedCardField.x,
        CONSTS.lastUsedCardField.y,
        CONSTS.lastUsedCardField.width,
        CONSTS.lastUsedCardField.height
    );
}

//ボタン作成
export function createButton(scene){
    //手札が0枚の場合、ボタンを消す
    if (myCards.length === 0) {
        if (okBtn) {
            if (okBtn) {
                okBtn.destroy();
                okBtn = null;
            }
        }
        return;
    }
    //ボタンの位置を計算
    let button_x = myCardField.x + myCardField.width;
    let button_y = myCardField.y - 80;
    //すでにボタンが存在する場合、位置を更新
    if (okBtn) {
        okBtn.x = button_x;
        okBtn.y = button_y;
        return;
    }
    //手札の右上にOKボタンを作成
    okBtn = scene.add.image(button_x, button_y, "button_ok").setScale(0.4).setInteractive();
    //ボタンのイベント
    okBtn.on(Phaser.Input.Events.POINTER_OVER, () => {
        scene.input.setDefaultCursor("pointer");
    });
    okBtn.on(Phaser.Input.Events.POINTER_OUT, () => {
        scene.input.setDefaultCursor("default");
    });
    okBtn.on(Phaser.Input.Events.POINTER_DOWN, () => {
        //カードを出す
        playCard(scene);
    });

}