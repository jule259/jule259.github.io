let socket = null;
let myPlayerID = null; // プレイヤーID
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