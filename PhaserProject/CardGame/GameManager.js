//サーバでゲームを管理するクラス
import { Player } from './public/js/player.js';
export class GameManager {
    constructor() {
        this.players = [];
        this.gameState = {};
        this.hostPlayerID = ""; // ホストプレイヤーのID
        this.hostSocketId = ""; // ホストプレイヤーのソケットID
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
        this.players.push(newplayer);
        this.updateGameState();
    }

    addRobotPlayer(playerID) {
        let newRobotPlayer = new Player(playerID);
        newRobotPlayer.type = "robot"; // ロボットプレイヤーとして設定
        newRobotPlayer.socketId = ""; // ロボットプレイヤーのソケットIDは空固定
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
}