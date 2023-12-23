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

const ShareCard = () => {
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
  const [fileProgress, setfileProgress] = useState<number>(0);
  const [fileNameState, setfileNameState] = useState<any>();
  const [fileChunkArr, setfileChunkArr] = useState<Uint8Array>();
  const [fileSending, setfileSending] = useState(false);

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
      if (peerRef.current) {
        peerRef.current.destroy();
        setacceptCaller(false);
        setacceptCaller(false);
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
      // Parse received data
      const parsedData = JSON.parse(data);

      if (parsedData.chunk) {
        // Handle the received chunk
        handleReceivingData(parsedData.chunk);

        // Update progress on the receiver's side
        const receivedProgress = parsedData.progress;
        setfileProgress(receivedProgress);
      } else if (parsedData.done) {
        // Handle the end of the file transfer
        handleReceivingData(parsedData);

        // Reset progress on the receiver's side
        setfileProgress(0);
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

    //receive data
    //peer.on data
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
      const parsedData = JSON.parse(data);

      if (parsedData.chunk) {
        // Handle the received chunk
        handleReceivingData(parsedData.chunk);

        // Update progress on the receiver's side
        const receivedProgress = parsedData.progress;
        setfileProgress(receivedProgress);
      } else if (parsedData.done) {
        // Handle the end of the file transfer
        handleReceivingData(parsedData);

        // Reset progress on the receiver's side
        setfileProgress(0);
      }
    });

    //verify the signal of the caller
    peer.signal(signalingData.signalData);
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
    setfileSending(true);
    const peer = peerRef.current;
    const file = fileUpload[0];
    const chunkSize = 16 * 1024; // 16 KB chunks (you can adjust this size)
    let offset = 0;

    const readAndSendChunk = () => {
      const chunk = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();

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
          setfileProgress((offset / file.size) * 100);

          offset += chunkSize;

          if (offset < file.size) {
            readAndSendChunk(); // Continue reading and sending chunks
          } else {
            // Signal the end of the file transfer
            peer.write(JSON.stringify({ done: true, fileName: file.name }));
            setfileProgress(100);
          }
        }
      };

      reader.readAsArrayBuffer(chunk);
    };

    readAndSendChunk();
    setfileSending(false);
  };

  const handleFileDownload = (fileRawData: any, tempFile: any) => {
    console.log(fileRawData, fileNameState);
    const blob = new Blob([fileRawData]);
    saveAs(blob, tempFile);
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
                  <Input
                    type="file"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e)}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleFileUploadBtn}
                    className=" flex gap-x-2"
                  >
                    <File size={15} />
                    Select File
                  </Button>
                </div>

                {fileUpload ? (
                  <div className="flex flex-col border rounded-lg  px-3 py-3 text-sm w-full gap-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex">{fileUpload[0]?.name}</div>
                      <div className="flex">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-[30px] px-2"
                          onClick={handleWebRTCUpload}
                        >
                          <Upload size={15} />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Progress
                        value={fileProgress}
                        className="h-1 bg-gray-200"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* download file */}
              {downloadFile ? (
                <div className="flex flex-col border rounded-lg  px-3 py-3 text-sm w-full gap-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex">{fileNameState}</div>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-[30px] px-2"
                        onClick={() =>
                          handleFileDownload(downloadFile, fileNameState)
                        }
                      >
                        <Download size={15} />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Progress
                      value={fileProgress}
                      className="h-1 bg-gray-200"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </form>
        </CardContent>
        {/* <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
          <div className="rounded-full bg-green-600 h-2 w-2 animate-ping">
            <div className="rounded-full bg-green-600 h-1 w-1"></div>
          </div>
        </CardFooter> */}
      </Card>

      <div>
        {acceptCaller ? (
          <Button
            variant="outline"
            className=" bg-green-500 text-white hover:bg-green-400"
            onClick={acceptUser}
          >
            Getting call from {signalingData.from}
          </Button>
        ) : null}
      </div>
    </>
  );
};

export default ShareCard;
