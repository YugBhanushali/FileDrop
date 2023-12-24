"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, CopyIcon, Download, File, Upload } from "lucide-react";
import { useSocket } from "@/context/SocketProvider";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";
import Peer from "simple-peer";
import { useRouter } from "next/navigation";
import { Progress } from "./ui/progress";
import { saveAs } from "file-saver";
import FileUpload from "./FileUpload";
import FileUploadBtn from "./FileUploadBtn";
import FileDownload from "./FileDownload";
import { io } from "socket.io-client";


const ShareCard = () => {
  const rounter = useRouter();
  const userDetails = useSocket();
  const [partnerId, setpartnerId] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const [isCopied, setisCopied] = useState(false);
  const [currentConnection, setcurrentConnection] = useState(false);
  const peerRef = useRef<any>();
  const [signalingData, setsignalingData] = useState<any>();
  const [acceptCaller, setacceptCaller] = useState(false);
  const [terminateCall, setterminateCall] = useState(false);
  const [fileUpload, setfileUpload] = useState<any>();
  const fileInputRef = useRef<any>();
  const [downloadFile, setdownloadFile] = useState<any>();
  const [fileUploadProgress, setfileUploadProgress] = useState<number>(0);
  const [fileDownloadProgress, setfileDownloadProgress] = useState<number>(0);
  const [fileNameState, setfileNameState] = useState<any>();
  const [fileChunkArr, setfileChunkArr] = useState<Uint8Array>();
  const [fileSending, setfileSending] = useState(false);
  const [fileReceiving, setfileReceiving] = useState(false);

  const addUserToSocketDB = () => {
    console.log("add user");
    console.log(userDetails.socket.id);
    userDetails.socket.emit("details", {
      socketId: userDetails.socket.id,
      uniqueId: userDetails.userId,
    });
  };

  function CopyToClipboard(value: any) {
    setisCopied(true);
    toast.success("Copied");
    navigator.clipboard.writeText(value);
    setTimeout(() => {
      setisCopied(false);
    }, 3000);
  }

  useEffect(() => {
    addUserToSocketDB();

    userDetails.socket.on("signaling", (data: any) => {
      console.log(data);
      setacceptCaller(true);
      setsignalingData(data);
      setpartnerId(data.from);
    });
    
    return () => {
      peerRef.current?.destroy();
      if (peerRef.current) {
        setacceptCaller(false);
        setacceptCaller(false);
        userDetails.socket.off();
      }
    };
  }, []);

  const callUser = () => {
    const peer = new Peer({
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

    //send the signal via socket
    peer.on("signal", (data) => {
      userDetails.socket.emit("send-signal", {
        from: userDetails.userId,
        signalData: data,
        to: partnerId,
      });
    });

    peer.on("data", (data) => {
      console.log(data);
      setfileReceiving(true);
      // Parse received data
      const parsedData = JSON.parse(data);

      if (parsedData.chunk) {
        // Handle the received chunk
        handleReceivingData(parsedData.chunk);

        // Update progress on the receiver's side
        const receivedProgress = parsedData.progress;
        setfileDownloadProgress(receivedProgress);
      } else if (parsedData.done) {
        // Handle the end of the file transfer
        handleReceivingData(parsedData);
        setfileChunkArr(undefined);
        // Reset progress on the receiver's side
        setfileDownloadProgress(0);
        setfileReceiving(false);
        toast.success("File received successfully");
      }
    });

    //receive accept signal via socket
    userDetails.socket.on("callAccepted", (data: any) => {
      peer.signal(data.signalData);
      setisLoading(false);
      setcurrentConnection(true);
      setterminateCall(true);
      toast.success(`Successful connection with ${partnerId}`);
    });

    peer.on("close", () => {
      console.log(`${partnerId} disconnected`);
      // Handle the disconnection, e.g., remove UI elements, update state, etc.
      setpartnerId("");
      setcurrentConnection(false);
      toast.error(`${partnerId} disconnected`);
      setfileUpload(false);
      setterminateCall(false);
    });

    peer.on("error", (err) => {
      console.log(err);
    });
  };

  const acceptUser = () => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
    });

    peerRef.current = peer;

    //send the signal to caller
    peer.on("signal", (data) => {
      userDetails.socket.emit("accept-signal", {
        signalData: data,
        to: partnerId,
      });
      setcurrentConnection(true);
      setacceptCaller(false);
      setterminateCall(true);
      toast.success(`Successful connection with ${partnerId}`);
    });

    peer.on("data", (data) => {
      // Parse received data
      setfileReceiving(true);
      const parsedData = JSON.parse(data);

      if (parsedData.chunk) {
        // Handle the received chunk
        handleReceivingData(parsedData.chunk);

        // Update progress on the receiver's side
        const receivedProgress = parsedData.progress;
        setfileDownloadProgress(receivedProgress);
      } else if (parsedData.done) {
        // Handle the end of the file transfer
        handleReceivingData(parsedData);
        setfileChunkArr(undefined);
        // Reset progress on the receiver's side
        setfileDownloadProgress(0);
        setfileReceiving(false);
      }
    });

    //verify the signal of the caller
    peer.signal(signalingData.signalData);

    peer.on("close", () => {
      console.log(`${partnerId} disconnected`);
      // Handle the disconnection, e.g., remove UI elements, update state, etc.
      setpartnerId("");
      setcurrentConnection(false);
      toast.error(`${partnerId} disconnected`);
      setfileUpload(false);
      setterminateCall(false);
    });

    peer.on("error", (err) => {
      console.log(err);
    });
  };

  const handleConnectionMaking = () => {
    setisLoading(true);
    callUser();
  };

  const handleFileUploadBtn = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e: any) => {
    setfileUpload(e.target.files);
    console.log(fileUpload);
  };

  function handleReceivingData(data: any) {
    if (data.done) {
      const parsed = data;
      setfileNameState(parsed.fileName);
    } else {
      const chunkIndices = Object.keys(data).map(Number);
      const maxIndex = Math.max(...chunkIndices);
      const tempChunkArr: Uint8Array = new Uint8Array(maxIndex + 1);
      chunkIndices.forEach((index) => (tempChunkArr[index] = data[index]));
      setfileChunkArr((prevFileData: Uint8Array | undefined) => {
        const prevFileLen = prevFileData ? prevFileData.length : 0;
        const newArray = new Uint8Array(prevFileLen + tempChunkArr.length);

        if (prevFileData) {
          newArray.set(prevFileData, 0); // Copy existing data
          tempChunkArr.forEach(
            (byte, index) => (newArray[prevFileData.length + index] = byte)
          );
        } else {
          return tempChunkArr;
        }
        setdownloadFile(newArray);
        return newArray;
      });
    }
  }

  const handleWebRTCUpload = () => {
    const peer = peerRef.current;
    const file = fileUpload[0];
    const chunkSize = 16 * 1024; // 16 KB chunks (you can adjust this size)
    let offset = 0;

    const readAndSendChunk = () => {
      const chunk = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();

      if (offset == 0) {
        setfileSending(true);
      }

      reader.onload = (event) => {
        if (event.target?.result) {
          const chunkData: any = event.target.result;
          const uint8ArrayChunk = new Uint8Array(chunkData);

          // Send the chunk data along with the progress information
          const progressPayload = {
            chunk: uint8ArrayChunk,
            progress: (offset / file.size) * 100,
          };
          console.log(progressPayload);
          peer.write(JSON.stringify(progressPayload));
          setfileUploadProgress((offset / file.size) * 100);

          offset += chunkSize;

          if (offset < file.size) {
            readAndSendChunk(); // Continue reading and sending chunks
          } else {
            // Signal the end of the file transfer
            peer.write(JSON.stringify({ done: true, fileName: file.name }));
            setfileUploadProgress(100);
            setfileSending(false);
            toast.success("Sended file successfully");
          }
        }
      };

      reader.readAsArrayBuffer(chunk);
    };

    readAndSendChunk();
  };


  return (
    <>
      <Card className="w-[550px]">
        <CardHeader>
          {/* <CardTitle>Create project</CardTitle>
          <CardDescription>
            Deploy your new project in one-click.
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col gap-y-1">
                <Label htmlFor="name">My ID</Label>
                <div className="flex flex-row justify-left items-center space-x-2">
                  <Input
                    disabled
                    id="name"
                    value={userDetails.userId}
                    placeholder="Name of your project"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    className="p-4"
                    onClick={() => CopyToClipboard(userDetails.userId)}
                  >
                    {isCopied ? (
                      <Check size={15} color="green" />
                    ) : (
                      <CopyIcon size={15} />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label htmlFor="name">Others ID</Label>
                <div className="flex flex-row justify-left items-center space-x-2">
                  <Input
                    id="name"
                    placeholder="ID"
                    onChange={(e) => setpartnerId(e.target.value)}
                    disabled={terminateCall}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    className="p-4 w-[160px]"
                    onClick={handleConnectionMaking}
                  >
                    {isLoading ? (
                      <TailSpin color="black" height={18} width={18} />
                    ) : (
                      <p>Connect</p>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label htmlFor="name">Connection Status</Label>
                <div className="flex flex-row justify-left items-center space-x-2">
                  <div className=" border rounded-lg  px-3 py-2 text-sm h-10 w-full ease-in-out duration-500 transition-all ">
                    {currentConnection ? partnerId : "No connection"}
                  </div>
                  <>
                    {terminateCall ? (
                      <Button
                        variant="outline"
                        type="button"
                        className="p-4 w-[160px] text-red-600 border-red-400 hover:bg-red-300 animate-in slide-in-from-right-[30px]"
                        onClick={() => {
                          peerRef.current.destroy();
                        }}
                      >
                        Terminate
                      </Button>
                    ) : null}
                  </>
                </div>
              </div>

              {/* file upload */}
              <div className="flex flex-col border rounded-lg  px-3 py-2 text-sm w-full ease-in-out duration-500 transition-all gap-y-2">
                <div>
                  <Label className=" font-semibold text-[16px]">Upload</Label>
                </div>
                <div>
                  <FileUploadBtn
                    inputRef={fileInputRef}
                    uploadBtn={handleFileUploadBtn}
                    handleFileChange={handleFileChange}
                  />
                </div>

                {fileUpload ? (
                  <FileUpload
                    fileName={fileUpload[0]?.name}
                    fileProgress={fileUploadProgress}
                    handleClick={handleWebRTCUpload}
                    showProgress={fileSending}
                  />
                ) : null}
              </div>

              {/* download file */}
              {downloadFile ? (
                <FileDownload
                  fileName={fileNameState}
                  fileReceivingStatus={fileReceiving}
                  fileProgress={fileDownloadProgress}
                  fileRawData={downloadFile}
                />
              ) : null}
            </div>
          </form>
        </CardContent>
        {acceptCaller ? (
          <CardFooter className="flex justify-center">
            <div>
              <Button
                variant="outline"
                className=" bg-green-500 text-white hover:bg-green-400"
                onClick={acceptUser}
              >
                Getting call from {signalingData.from}
              </Button>
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </>
  );
};

export default ShareCard;
