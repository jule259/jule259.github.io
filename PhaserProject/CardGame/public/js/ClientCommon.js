let socket = null;
let myPlayerID = null; // プレイヤーID
let players = []; // プレイヤー情報を格納する配列
let playerMe = null; // 自分のプレイヤー情報

export function getSocket() {
    if (!socket) {
        socket = io('http://localhost:8088');
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