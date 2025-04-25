const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public")); // Phaser のファイルを公開

io.on("connection", (socket) => {
  console.log("A user connected");

  // クライアントからスコアを受け取る
  socket.on("score", (data) => {
    console.log("Received score:", data);
    // 例えば他のプレイヤーにブロードキャスト
    socket.broadcast.emit("newScore", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(8088, '0.0.0.0', () => {
  console.log('Server is running on port 8088');
});


/********old *********/

// const http = require("node:http");
// const fs = require("fs");
// const path = require("path");

// const hostname = "localhost";
// // const hostname = "192.168.2.105"; // 自分のIPアドレスに変更
// const port = 8088;

// const server = http.createServer((req, res) => {
//   // CORSヘッダーを設定
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//   // リクエストがルートの場合、index.htmlを返す
//   const filePath = req.url === "/" ? "/public/index.html" : req.url;
//   const extname = path.extname(filePath);

//   // MIMEタイプを設定
//   const mimeTypes = {
//     ".html": "text/html",
//     ".js": "application/javascript",
//     ".css": "text/css",
//     ".json": "application/json",
//     ".png": "image/png",
//     ".jpg": "image/jpeg",
//     ".gif": "image/gif",
//     ".svg": "image/svg+xml",
//     ".wav": "audio/wav",
//     ".mp4": "video/mp4",
//     ".woff": "application/font-woff",
//     ".ttf": "application/font-ttf",
//     ".eot": "application/vnd.ms-fontobject",
//     ".otf": "application/font-otf",
//     ".wasm": "application/wasm",
//   };

//   const contentType = mimeTypes[extname] || "application/octet-stream";

//   // ファイルを読み込む
//   const fullPath = path.join(__dirname, filePath);
//   fs.readFile(fullPath, (err, data) => {
//     if (err) {
//       if (err.code === "ENOENT") {
//         // ファイルが見つからない場合
//         res.statusCode = 404;
//         res.setHeader("Content-Type", "text/plain");
//         res.end("404 Not Found\n");
//       } else {
//         // その他のエラー
//         res.statusCode = 500;
//         res.setHeader("Content-Type", "text/plain");
//         res.end("Internal Server Error\n");
//       }
//     } else {
//       // ファイルを正常に読み込んだ場合
//       res.statusCode = 200;
//       res.setHeader("Content-Type", contentType);
//       res.end(data);
//     }
//   });
// });

// // サーバーを起動
// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });
