import * as CONSTS from './const.js';
import { Player } from './player.js';
import { getSocket, getMyPlayerID, setPlayers, getPlayerMe, setPlayerMe} from './ClientCommon.js';

let lastUsedCard = null; // 最後に出したカード
let lastUsedCards =[]; // 最後に出したカードを格納する配列
let okBtn = null; // OKボタン
export let deckData = []; // デッキのカードを格納する配列
// let usedCards = []; // 出したカードの配列
let myCardsObj = []; // 手札を格納する配列
let selectedCards = []; // 選択したカードの配列
let gameOver = false;

//手札カードフィールド
let myCardField = {
    x : 200,
    y : 600,
    width : 200,
    height : 145,
}

export function startGame(scene){
    // 共通socketを取得
    const socket = getSocket();

    //デッキを作成
    // createDeck(scene);
    let playerMe = null;
    let playerLeft = null;
    let playerRight = null;
    let players = [];
    //サーバからプレイヤー情報を取得
    socket.emit("getAllPlayerInfo", socket.id);
    //プレイヤー情報を受信

    //socket.off("allPlayerInfo"); // Remove existing listener
    let playersData = [];
    socket.on("allPlayerInfo", (data) => {
        playersData = JSON.parse(data);
        console.log("PlayersData:", playersData);
        //プレイヤー情報を設定
        playersData.forEach((player) => {
            if (player.id === getMyPlayerID()) {//自分のプレーヤー
                playerMe = new Player(player.id);
                playerMe.type = player.type;
                playerMe.status = player.status;
                setPlayerMe(playerMe); // 自分のプレイヤー情報を保存
                players.push(playerMe);
            } else {
                if (!playerLeft) {//左側のプレーヤー
                    playerLeft = new Player(player.id);
                    playerLeft.type = player.type;
                    playerLeft.status = player.status;
                    playerLeft.position_x = CONSTS.leftPlayerField.x + CONSTS.leftPlayerField.width / 2;
                    playerLeft.position_y = CONSTS.leftPlayerField.y + CONSTS.leftPlayerField.height / 2;
                    players.push(playerLeft);
                } else if (!playerRight) {//右側のプレーヤー
                    playerRight = new Player(player.id);
                    playerRight.type = player.type;
                    playerRight.status = player.status;
                    playerRight.position_x = CONSTS.rightPlayerField.x + CONSTS.rightPlayerField.width / 2;
                    playerRight.position_y = CONSTS.rightPlayerField.y + CONSTS.rightPlayerField.height / 2;
                    players.push(playerRight);
                } else {
                    //それ以外のプレーヤーは無視
                }
            }
        });
        setPlayers(players); // プレイヤー情報を保存
        console.log("全プレーヤー情報：", players);

        //プレーヤ初期化完了後、サーバへ通信
        socket.emit("PlayersInitialized", playerMe.id);
    });



    // //デッキをシャッフルし、カードを引く
    // shuffleDeck(scene, 0, () => {
    //     // 3人分のdrawCardが終わったら呼ばれるコールバック
    //     let finishedCount = 0;
    //     function onDrawFinished() {
    //         finishedCount++;
    //         if (finishedCount === 3) {
    //             // 全員分のdrawCardが終わったら送信
    //             if (playerMe.type == "host") {
    //                 socket.emit("updatePlayersCards", JSON.stringify(
    //                     {
    //                         [playerMe.id]: playerMe.myCards,
    //                         [playerLeft.id]: playerLeft.myCards,
    //                         [playerRight.id]: playerRight.myCards,
    //                     }
    //                 ));
    //                 console.log("自分の手札：");
    //                 console.log(playerMe.myCards);
    //             }
    //         }
    //     }
    //     drawCard(scene, 17, playerMe, 0, onDrawFinished);
    //     drawCard(scene, 17, playerLeft, 0, onDrawFinished);
    //     drawCard(scene, 17, playerRight, 0, onDrawFinished);
    // });
}

//カードを引く
//scene：シーン
//drawNum：引く枚数
//player：プレーヤーオブジェクト
//nowNum：現在の引いた枚数（初期値は0）
//cardArr：引くカードの配列（初期値は空オブジェクト）
//戻り値：なし
export function drawCard(scene , drawNum , player, nowNum = 0 , cardArr = {}, cb = null) {
    if (player.id != getMyPlayerID()){//自分以外のプレーヤー
        if (nowNum >= drawNum) {//ドロー終了
            //手札をソート
            sortCard(player.myCardsObj, "pointValue", "asc");
            //プレーヤのカード情報を更新
            player.updateMyCardsFromObj();
            if (cb) cb(); // コールバック呼び出し
            return;
        }

        let card = null; // 引くカードを初期化
        //デッキのカードを引く
        if (cardArr && cardArr.length > 0) {//引くカードの配列がある場合
           let cardKey = cardArr[nowNum].key;
            // 引くカードのキーを使ってデッキからカードを取得
            card = deckData.find(c => c.key === cardKey);
            if (!card) {
                console.log("デッキにカードがありません");
                return;
            }
            // デッキからカードを削除
            deckData = deckData.filter(c => c.key !== cardKey);
        } else {
            card = deckData.pop();
            if (!card) {
                console.log("デッキが空です");
                return;
            }
        }
        player.myCardsObj.push(card);//手札に追加

        // カードを引いたときのアニメーション
        scene.tweens.add({
            targets: card,
            x: player.position_x, // 目標のX座標
            y: player.position_y, // 目標のY座標
            ease: 'Power2', // イージング
            duration: 100, // 移動にかける時間（ミリ秒）
            onComplete: () => {// 移動完了後に実行される処理
                //プレーヤー情報を表示
                showOtherPlayerInfo(scene, player);
                //再帰処理
                drawCard(scene, drawNum, player, nowNum + 1, cardArr, cb);
            },
        });
    } else {//自分のプレーヤー
        let playerMe = getPlayerMe();
        if (nowNum >= drawNum) {//ドロー終了
            //手札をソート
            sortCard(myCardsObj, "pointValue", "asc");
            //手札の位置を再調整する
            adjustMyCardPosition(scene);
            //手札を自分のプレーヤーに設定
            playerMe.myCardsObj = myCardsObj;
            //プレーヤのカード情報を更新
            playerMe.updateMyCardsFromObj();
            console.log(playerMe.type + "出せるカードの種類" + getPlayableCards(myCardsObj));
            if (cb) cb(); // コールバック呼び出し
            return;
        }

        //引く枚数より、手札フィルドの幅を計算
        let myCardFiledWidth = myCardsObj.length * CONSTS.cardInfo.width ;//手札フィールドの幅
        //手札フィールドの開始座標（x座標）
        let myCardFieldStartX = scene.cameras.main.width / 2 - myCardFiledWidth / 2;

        let card = null; // 引くカードを初期化
        //デッキのカードを引く
        if (cardArr && cardArr.length > 0) {//引くカードの配列がある場合
            let cardKey = cardArr[nowNum].key;
            // 引くカードのキーを使ってデッキからカードを取得
            card = deckData.find(c => c.key === cardKey);
            if (!card) {
                console.log("デッキにカードがありません");
                return;
            }
            // デッキからカードを削除
            deckData = deckData.filter(c => c.key !== cardKey);
        } else {
            card = deckData.pop();
            if (!card) {
                console.log("デッキが空です");
                return;
            }
        }
        //カードを最前面に移動
        scene.children.bringToTop(card);
        //カードを手札に移動する時のX座標を計算(現在手札の一番右のカードのX座標 + 100)
        let targetX = myCardFieldStartX + CONSTS.cardInfo.width * (myCardsObj.length);
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
                drawCard(scene, drawNum, player, nowNum + 1, cardArr, cb);
            },
        });
    }
}

//手札のカードの位置を再調整する
function adjustMyCardPosition(scene, cb = null){
    if  (myCardsObj.length === 0) {
        //ボタンを作成（削除）
        createButton(scene);
        return;
    }

    //手札フィールドの幅を計算
    let myCardFiledWidth = myCardsObj.length * CONSTS.cardInfo.width;
    //手札フィールドの開始座標（x座標）
    let myCardFieldStartX = scene.cameras.main.width / 2 - myCardFiledWidth / 2;
    //手札フィルド属性を更新
    myCardField.x = myCardFieldStartX;
    myCardField.width = myCardFiledWidth;

    for (let i = 0; i < myCardsObj.length; i++) {
        let targetX = myCardFieldStartX + CONSTS.cardInfo.width * i;

        // アニメーション
        scene.tweens.add({
            targets: myCardsObj[i],
            x: targetX, // 目標のX座標
            y: myCardField.y, // 目標のY座標
            ease: 'Power2', // イージング
            duration: 500, // 移動にかける時間（ミリ秒）
            onComplete: () => {// 移動完了後に実行される処理
                //全てのアニメーションが終了したら
                if ((i === myCardsObj.length - 1)) {
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
function createCard(scene, card) {
    //カスタムプロパティ
    card.originalY = card.y;// 元のY座標
    card.isSelect = false;// 選択状態
    card.showNo = myCardsObj.length + 1;// 手札の表示番号

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
    myCardsObj.push(card);
    return card;
}

//カードをソートする
function sortCard(cards, sortkey, sortType = "asc") {
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
function playCard(scene){
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
        myCardsObj = myCardsObj.filter((c) => c !== card);

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
function getCardType(cards){
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

//カードを出せるかをチェック
function playCheck(cards){
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
function countCardsInfo(cards){
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
        if (cardsInfoArr[card.pointValue] >= maxSameCardCount) {
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
export function createDeck(scene, deck){
    //デッキのカードを初期化
    deckData = [];
    //デッキのカードを作成
    let deckField_center_x = CONSTS.deckField.x + CONSTS.deckField.width / 2; //デッキの中心座標（X軸）
    let deckField_center_y = CONSTS.deckField.y + CONSTS.deckField.height / 2; //デッキの中心座標（Y軸）

    //デッキのカードを追加
    deck.forEach((card) => {
        let deckCard = scene.add.image(deckField_center_x, deckField_center_y, "card_back_blue").setScale(0.2);
        deckCard.key = card.key;
        deckCard.pointValue = card.value;
        deckCard.type = card.type; // カードのタイプを追加
        deckData.push(deckCard);
    });

    // CONSTS.cardResource.forEach((card) => {
        //     let deckCard = scene.add.image(deckField_center_x, deckField_center_y, "card_back_blue").setScale(0.2);
        //     deckCard.key = card.key;
        //     deckCard.pointValue = card.value;
        //     deckCard.type = card.type; // カードのタイプを追加
        //     deckData.push(deckCard);
    // });

    //デッキの一番上に背面を表示
    // let deckBack = scene.add.image(deckField_center_x, deckField_center_y, "card_back_blue").setScale(0.2).setInteractive();
    //背面のカードをクリックしたときカードを一枚引く
    // deckBack.on('pointerdown', () => {
    //     if (gameOver) {
    //         return;
    //     }

    //     //カードを引く
    //     drawCard(scene, 1);
    // });
}

//デッキをシャッフル（アニメーションのみ）
export function shuffleDeck(scene, nowNum = 0 ,cb = null){
    if (nowNum >= 5 || nowNum >= deckData.length) {//アニメーション回数が5回以上、またはデッキの枚数以上の場合、シャッフル終了
        //Phaser.Utils.Array.Shuffle(deckData); //シャッフル
        if (cb) {
            cb();
        }
        return;
    }
    let targetX = CONSTS.deckField.x + CONSTS.deckField.width;
    //アニメーションを追加
    scene.tweens.add({
        targets: deckData[nowNum],
        x: targetX, //目標のX座標
        ease: 'Power2', //イージング
        duration: 100, //移動にかける時間（ミリ秒）
        yoyo: true, //リピート
        onComplete: () => {//移動完了後に実行される処理
            //全てのアニメーションが終了したらコールバック関数を実行
            if (cb) {
                shuffleDeck(scene, nowNum + 1, cb);
            } else {
                shuffleDeck(scene, nowNum + 1);
            }
        },
    });
}

//フィールドを作成
export function createField(scene){
    //**********デッキのフィールドを作成**********//
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

    //**********出したカードのフィールドを作成**********//
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

    //**********最後に出したカードのフィールドを作成**********//
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

    //**********左プレーヤーのフィルドを作成**********//
    const leftPlayerFieldGraphics = scene.add.graphics();

    //フィールドのデザインを設定
    leftPlayerFieldGraphics.fillStyle(0x000000, 0.5); //RGBAで50%の透明度
    leftPlayerFieldGraphics.fillRect(
        CONSTS.leftPlayerField.x,
        CONSTS.leftPlayerField.y,
        CONSTS.leftPlayerField.width,
        CONSTS.leftPlayerField.height
    );

    //フィールドの境界線を描画（任意）
    leftPlayerFieldGraphics.lineStyle(2, 0x000000, 1); //黒い線
    leftPlayerFieldGraphics.strokeRect(
        CONSTS.leftPlayerField.x,
        CONSTS.leftPlayerField.y,
        CONSTS.leftPlayerField.width,
        CONSTS.leftPlayerField.height
    );

    //**********右プレーヤーのフィルドを作成**********//
    const rightPlayerFieldGraphics = scene.add.graphics();

    //フィールドのデザインを設定
    rightPlayerFieldGraphics.fillStyle(0x000000, 0.5); //RGBAで50%の透明度
    rightPlayerFieldGraphics.fillRect(
        CONSTS.rightPlayerField.x,
        CONSTS.rightPlayerField.y,
        CONSTS.rightPlayerField.width,
        CONSTS.rightPlayerField.height
    );
    //フィールドの境界線を描画（任意）
    rightPlayerFieldGraphics.lineStyle(2, 0x000000, 1); //黒い線
    rightPlayerFieldGraphics.strokeRect(
        CONSTS.rightPlayerField.x,
        CONSTS.rightPlayerField.y,
        CONSTS.rightPlayerField.width,
        CONSTS.rightPlayerField.height
    );

}

//OKボタン作成
function createButton(scene){
    let playerMe = getPlayerMe();
    //手札が0枚,または自分が待ち状態の場合、ボタンを消す
    if (myCardsObj.length === 0 || playerMe.status === "waiting") {
        //ボタンを削除
        if (okBtn) {
            okBtn.destroy();
            okBtn = null;
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
        console.log( "出せるカードの種類" + getPlayableCards(myCardsObj));
    });
}

//出せるカードを取得する
//戻り値：出せるカードの配列 => []
function getPlayableCards(cards) {
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
            if(cards.length > 3){
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
            if(cardInfo.maxSameCardCount === 3 && cardInfo.maxSameCardValue !== key){
                playableType.push("three_with_pair");
            }
            //bomb with pair
            if(cardInfo.maxSameCardCount === 4 && cardInfo.maxSameCardValue !== key){
                playableType.push("bomb_with_pair");
            }
        }
    });

    //重複を削除
    playableType = [...new Set(playableType)];
    return playableType;
}

//プレーヤー情報を表示
function showOtherPlayerInfo(scene, player){
    //プレーヤー名を表示
    if (player.idObj) {//テキストが存在する場合、削除
        player.idObj.destroy();
    }
    player.idObj = scene.add.text(player.position_x, player.position_y - 100, player.id, {
        fontSize: '20px',
        fill: '#fff'
    }).setOrigin(0.5);

    //カード枚数を表示
    if (player.textObj) {//テキストが存在する場合、削除
        player.textObj.destroy();
    }
    player.textObj = scene.add.text(player.position_x, player.position_y + 100, "Cards: " + player.myCardsObj.length, {
        fontSize: '20px',
        fill: '#fff'
    }).setOrigin(0.5);
}

// ゲーム開始をまつとき、画面に「waiting for players」と表示
export function waitingForPlayers(scene) {
    console.log("Waiting for players...");
    
    // 画面中央にテキストを表示
    const waitingText = scene.add.text(
        scene.cameras.main.width / 2,
        scene.cameras.main.height / 2,
        'Waiting for players...',
        {
            fontSize: '32px',
            fill: '#fff'
        }
    ).setOrigin(0.5);

    const socket = getSocket();

    console.log ("Socket initialized:", socket.id);
    // Promiseでゲーム開始を待つ
    return new Promise((resolve) => {
        socket.on("startGame", () => {
            waitingText.destroy(); // テキストを削除
            resolve(); // ゲーム開始！
        });
    });
}
