let socket = null;
let myPlayerID = null; // プレイヤーID
let players = []; // プレイヤー情報を格納する配列
let playerMe = null; // 自分のプレイヤー情報
let waitingText = null; // 待機中のテキスト

export function getSocket() {
    if (!socket) {
        socket = io();
    }
    return socket;
}
export function getMyPlayerID() {
    return myPlayerID;
}
export function setMyPlayerID(playerID) {
    myPlayerID = playerID;
}
export function getPlayers() {
    return players;
}
export function setPlayers(newPlayers) {
    players = newPlayers;
}
export function getPlayerMe() {
    return playerMe;
}
export function setPlayerMe(player) {
    playerMe = player;
}
export function getPlayerById(playerId) {
    return players.find(player => player.id === playerId);
}
export function getWaitingText() {
    return waitingText;
}
export function setWaitingText(text) {
    waitingText = text;
}