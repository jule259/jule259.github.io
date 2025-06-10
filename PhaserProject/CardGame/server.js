import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { GameManager } from "./GameManager.js"; // ゲームロジックを管理するクラス
import e from "express";

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
  socket.on('disconnect', function () {// ソケットが切断されたときの処理
    console.log('A user disconnected: ' + socket.id);
    GM.removePlayerBySocketId(socket.id); // ソケットIDでプレイヤーを削除
    // hostプレイヤーが切断された場合、全てのプレイヤーを削除
    if (GM.hostSocketId === socket.id) {
      console.log("Host player disconnected, removing all players.");
      GM.players.forEach(player => {
        GM.removePlayer(player.id); // 全てのプレイヤーを削除
      });
    } else {
      console.log("Removing player by socket ID:", socket.id);
    }
    socket.disconnect(); // ソケットを切断
  });

  // プレイヤーの追加
  socket.on("addPlayer", () => {
    let playerID = GM.players.length + 1; // プレイヤーIDを自動生成
    GM.addPlayer(playerID, socket.id); // プレイヤーIDを自動生成
    console.log("Adding player:", playerID);
    socket.emit("playerAdded", playerID); // プレイヤー追加完了をクライアントに通知
  });

  // ロボットプレイヤーの追加
  socket.on("addRobotPlayer", () => {
    let playerID = GM.players.length + 1; // プレイヤーIDを自動生成
    console.log("Adding robot player:", playerID);
    GM.addRobotPlayer(playerID); // ロボットプレイヤー追加のロジックをここに実装
  });

  // 全員プレイヤーの情報を取得
  socket.on("getAllPlayerInfo", (socketId) => {
    console.log("Getting allplayer info by:", socketId);
    const allPlayerInfo = GM.players;
    socket.emit("allPlayerInfo", JSON.stringify(allPlayerInfo));
  });

// プレーヤーカード更新
  socket.on("updatePlayersCards", (data) => {
    // クライアントから送られてきたデータをパースするよ
    let playersCards = JSON.parse(data);

    // オブジェクトの各プレイヤーIDとカード配列を取り出して更新する！
    Object.entries(playersCards).forEach(([playerId, myCards]) => {
      GM.updatePlayerCards(Number(playerId), myCards);
      console.log("Updating player cards for:", playerId);
    });

    // デバッグ用に1番目のプレイヤーのカード情報を表示しとくね
    if (GM.players[0]) {
      console.log(GM.players[0].getMyCards());
    }
  });

  // プレイヤーの削除
  socket.on("removePlayer", (playerId) => {
    console.log("Removing player:", playerId);
    GM.removePlayer(playerId);
  });

  // 

  // ゲーム状態の取得
  socket.on("getGameState", () => {
    console.log("Getting game state");
    // ゲーム状態取得のロジックをここに実装
    // 例: const gameState = gameManager.getGameState();
    // socket.emit("gameState", gameState);
  });
});
