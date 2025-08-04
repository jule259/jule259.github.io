import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { GameManager } from "./GameManager.js"; // ゲームロジックを管理するクラス

const GM = new GameManager(); // ゲームマネージャのインスタンスを作成
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Redis クライアントの設定
const client = createClient(); // デフォルトで localhost:6379
client.on("error", (err) => console.error("Redis Client Error", err));
// Redis クライアントの接続
await client.connect();
// await client.set("myKey", "Hello, Redis!");
// const value = await client.get("myKey");
// console.log("Redis value:", value);

// 静的ファイル公開（Phaser など）
app.use(express.static("public"));

// サーバ起動
server.listen(8088, "0.0.0.0", () => {
  console.log("Server is running on port 8088");
});

/**********ゲームロジック***********/
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  GM.initGame(); // ゲームの初期化
  socket.on('disconnect', function () { // ソケットが切断されたときの処理
    console.log('A user disconnected: ' + socket.id);
    let socketIdDelete = socket.id;
    GM.removePlayerBySocketId(socketIdDelete); // ソケットIDでプレイヤーを削除
    // hostプレイヤーが切断された場合、全てのプレイヤーを削除
    console.log("Checking if host player is disconnected:", GM.hostSocketId);
    if (GM.hostSocketId === socketIdDelete) {
      console.log("Host player disconnected, removing all players.");
      GM.players.forEach(player => {
        GM.removePlayer(player.id); // 全てのプレイヤーを削除
      });
      GM.initGame(); // ゲームの初期化
    } else {
      console.log("Removing player by socket ID:", socketIdDelete);
    }
  });

  // ユーザ再読み込み時の処理
  // socket.on("reload", () => {
  //   console.log("User reloaded, sending all player info.");
  //   const allPlayerInfo = GM.players;
  //   socket.emit("allPlayerInfo", JSON.stringify(allPlayerInfo));
  // });

  // プレイヤーの追加
  socket.on("addPlayer", () => {
    if (GM.players.length <3) { // 最大3人までプレイヤーを追加
      let playerID = GM.players.length + 1; // プレイヤーIDを自動生成
      GM.addPlayer(playerID, socket.id); // プレイヤーIDを自動生成
      console.log("Adding player:", playerID);
      socket.emit("playerAdded", playerID); // プレイヤー追加のイベントをクライアントに送信
    }
    if (GM.players.length >= 3) {// プレイヤーが3人以上ならゲーム開始
      console.log("Enough players to start the game");
      // 全プレイヤーの情報を送信
      socket.emit("allPlayerInfo", JSON.stringify(GM.players));
      //デッキ情報をクライアントに送信
      socket.emit("deckInfo", JSON.stringify(GM.deck)); // デッキ情報を全クライアントに送信
      socket.emit("startGame"); // クライアントにゲーム開始を通知
    }
  });

  // ロボットプレイヤーの追加
  socket.on("addRobotPlayer", () => {
    if (GM.players.length < 3) {
      let playerID = GM.players.length + 1; // プレイヤーIDを自動生成
      console.log("Adding robot player:", playerID);
      GM.addRobotPlayer(playerID); // ロボットプレイヤー追加のロジックをここに実装
    }
    if (GM.players.length >= 3) {// プレイヤーが3人以上ならゲーム開始
      console.log("Enough players to start the game");
      // 全プレイヤーの情報を送信
      socket.emit("allPlayerInfo", JSON.stringify(GM.players));
      // デッキ情報をクライアントに送信
      socket.emit("deckInfo", JSON.stringify(GM.deck)); // デッキ情報を全クライアントに送信
      socket.emit("startGame"); // クライアントにゲーム開始を通知（個別送信に統一！）
    }
  });

  // 全員プレイヤーの情報を取得
  socket.on("getAllPlayerInfo", (socketId) => {
    console.log("Getting allplayer info by:", socketId);
    const allPlayerInfo = GM.players;
    socket.emit("allPlayerInfo", JSON.stringify(allPlayerInfo));
  });

  // プレイヤー初期化完了
  socket.on("PlayersInitialized", (playerId) => {
    console.log("Player initialized:", playerId);
    const player = GM.players.find(p => p.id === Number(playerId));
    console.log("playercount:", GM.players.length);
    if (player) {
      console.log(`Player ${playerId} initialized with socket ID: ${socket.id}`);
      if (player.type === "host") {// ホストプレイヤーならゲーム開始
        //全員に17枚のカードをドローさせる
        // 全プレイヤーに個別でカード配布イベントを送るぜ！
        GM.players.forEach(p => {
          GM.playerDrawCard(io, p.id, 17);
        });
        console.log(`Host player ${playerId} initialized, starting game.`);
      }
    } else {
      console.error(`Player with ID ${playerId} not found.`);
    }
  });

  // プレーヤーカード更新
  // socket.on("updatePlayersCards", (data) => {
  //   // クライアントから送られてきたデータをパースする
  //   let playersCards = JSON.parse(data);

  //   // オブジェクトの各プレイヤーIDとカード配列を取り出して更新する
  //   Object.entries(playersCards).forEach(([playerId, myCards]) => {
  //     GM.updatePlayerCards(Number(playerId), myCards);
  //     console.log("Updating player cards for:", playerId);
  //   });
  // });

  // プレイヤーの削除
  socket.on("removePlayer", (playerId) => {
    console.log("Removing player:", playerId);
    GM.removePlayer(playerId);
  });

  // ゲーム状態の取得
  socket.on("getGameState", () => {
    console.log("Getting game state");
    // ゲーム状態取得のロジックをここに実装
  });

  socket.on("deckShuffled", () => {
    console.log("Deck has been shuffled, notifying all players.");
    GM.isShuffled = true; // デッキがシャッフルされたフラグを立てる
  });
});

