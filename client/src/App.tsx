import { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";
import { saveAs } from "file-saver";

const sockets = io("http://localhost:8000");

function App() {
  const [receivedData, setReceivedData] = useState<any>();
  const [signalStatus, setSignalStatus] = useState("Not accepted");
  const [myID, setMyID] = useState<string>("no");
  const [partnerId, setPartnerId] = useState<string>("no");
  const [acceptCaller, setAcceptCaller] = useState(false);
  const [signalingData, setSignalingData] = useState<any>({});
  const [fileInput, setFileInput] = useState<any>();
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const peerRef = useRef<any>();
  const [rawData, setrawData] = useState<any>();
  const [fileNameState, setfileNameState] = useState<any>("");

  useEffect(() => {
    sockets.on("signaling", (data) => {
      console.log(data);
      setAcceptCaller(true);
      setSignalingData(data);
      setPartnerId(data.from);
    });
  }, []);

  const setUserID = () => {
    sockets.emit("details", {
      socketId: sockets.id,
      uniqueId: myID,
    });
  };

  const callUser = () => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "stun:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
          {
            urls: "turn:numb.viagenie.ca",
            username: "sultan1640@gmail.com",
            credential: "98376683",
          },
        ],
      },
    });

    peerRef.current = peer;

    peer.on("signal", (data) => {
      console.log("Signal data:", data);
      sockets.emit("send-signal", {
        from: myID,
        signalData: data,
        to: partnerId,
      });
    });

    peer.on("data", (data) => {
      if (data instanceof ArrayBuffer) {
        setReceivedData(data);
        console.log("Received file data:", data);
      } else {
        console.log("Received data:", data);
        handleReceivingData(data)
      }
    });

    sockets.on("callAccepted", (data) => {
      peer.signal(data.signalData);
      setSignalStatus("Signal accepted");
    });

  };

  const acceptCall = () => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
    });

    peerRef.current = peer;

    peer.on("signal", (data) => {
      sockets.emit("accept-signal", {
        signalData: data,
        to: partnerId,
      });
    });

    peer.signal(signalingData.signalData);

    peer.on("data", (data) => {
      console.log("Accept call fnc");
      if (data instanceof ArrayBuffer) {
        setReceivedData(data);
        console.log("Received file data:", data);
        // Save received file for download
        const newFile = { data, name: `ReceivedFile_${Date.now()}.txt` };
        setReceivedFiles((prevFiles) => [...prevFiles, newFile]);
      } else {
        // console.log("Received data:", data);
        // console.log(data.toString());
        // const json = new TextDecoder("utf-8").decode(data)
        handleReceivingData(data);
        // setrawData(data);
      }
    });
  };

  function handleReceivingData(data: any) {
    if (data.toString().includes("done")) {
      const parsed = JSON.parse(data);
      setfileNameState(parsed.fileName);
    } else {
      setrawData(data);
    }
  }

  const downloadFile = (fileRawData: any, fileName: any) => {
    const blob = new Blob([fileRawData]);
    saveAs(blob, fileName);
  };

  const selectFiles = () => {
    console.log(fileInput[0]);
    const peer = peerRef.current;
    const stream = fileInput[0].stream();
    const reader = stream.getReader();
    const tempReader = new FileReader();

    reader.read().then((obj) => {
      handlereading(obj.done, obj.value);
    });

    function handlereading(done, value) {
      if (done) {
        peer.write(JSON.stringify({ done: true, fileName: fileInput[0].name }));
        return;
      }

      peer.write(value);
      reader.read().then((obj) => {
        handlereading(obj.done, obj.value);
      });
    }

    tempReader.onload = () => {
      const fileData = tempReader.result;
      peer.send(fileData);
    };
    tempReader.readAsArrayBuffer(fileInput[0]);
    console.log("from handle reading func", tempReader);
  };

  return (
    <>
      <input onChange={(e) => setMyID(String(e.target.value))} />
      <button onClick={setUserID}>ID</button>
      <br />
      <input onChange={(e) => setPartnerId(e.target.value)} />
      <button onClick={callUser}>Call</button>
      <br />

      <input type="file" onChange={(e: any) => setFileInput(e.target.files)} />
      <button onClick={selectFiles}>Send files</button>
      <br />
      <br />
      {signalStatus}
      {acceptCaller ? (
        <>
          <p>{signalingData?.from} is calling you</p>
          <button onClick={acceptCall}>Accept</button>
        </>
      ) : null}
      <br />
      {receivedFiles.map((file, index) => (
        <div key={index}>
          <button onClick={() => downloadFile(rawData, fileNameState)}>
            Download {file.name}
          </button>
        </div>
      ))}
      {fileNameState ? (
        <>
          <button onClick={() => downloadFile(rawData, fileNameState)}>
            Download {fileNameState}
          </button>
        </>
      ) : null}
    </>
  );
}

export default App;
