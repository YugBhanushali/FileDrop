const dotenv = require("dotenv");
dotenv.config({ silent: process.env.NODE_ENV === 'production' });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

const allowedOrigins = ["http://localhost:3000", process.env.URL];
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const httpServer = http.createServer(app);

app.get("/", (req, res) => {
  res.send("hello from server");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

var records = new Map();
const usersToUniquedID = new Map();
const uniqueIdTousers = new Map();

io.on("connection", (socket) => {
  // console.log(socket.id);
  socket.on("joinRoom", (temp) => {
    socket.join(Number(temp));
    records.set(socket.id, Number(temp));
    socket.emit("ack", `You have joined room ${temp}`);
  });

  socket.on("message", (temp) => {
    const roomNum = records.get(socket.id);
    io.to(roomNum).emit("roomMsg", temp);
  });

  socket.on("details", (data) => {
    var user = data.socketId;
    var uniqueId = data.uniqueId;

    usersToUniquedID.set(user, uniqueId);
    uniqueIdTousers.set(uniqueId, user);
    console.log("New User added");
    for (let [key, value] of usersToUniquedID) {
      console.log(key + " = " + value);
    }
  });

  socket.on("send-signal", (temp) => {
    console.log(temp);
    var to = temp.to;
    var socketOfPartner = uniqueIdTousers.get(to);
    io.to(socketOfPartner).emit("signaling", {
      from: temp.from,
      signalData: temp.signalData,
      to: temp.to,
    });
    // io.emit("receive-signal",temp)
  });

  socket.on("accept-signal", (temp) => {
    console.log(temp);
    var to = temp.to;
    var socketOfPartner = uniqueIdTousers.get(to);
    console.log(socketOfPartner);
    io.to(socketOfPartner).emit("callAccepted", {
      signalData: temp.signalData,
      to: temp.to,
    });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);

    // Remove the disconnected socket ID from maps
    const user = socket.id;
    const uniqueId = usersToUniquedID.get(user);

    usersToUniquedID.delete(user);
    uniqueIdTousers.delete(uniqueId);

    // Log the updated maps
    console.log("Updated usersToUniquedID:");
    for (let [key, value] of usersToUniquedID) {
      console.log(key + " = " + value);
    }

    console.log("Updated uniqueIdTousers:");
    for (let [key, value] of uniqueIdTousers) {
      console.log(key + " = " + value);
    }
  });
});

httpServer.listen(process.env.PORT || 8000, () => {
  console.log(`Listining on ${process.env.PORT ? process.env.PORT : "8000"}`);
});
