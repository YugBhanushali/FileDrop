"use client";
import React, { useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, CopyIcon } from "lucide-react";
import { useSocket } from "@/context/SocketProvider";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";
import Peer from "simple-peer";
import FileUpload from "./FileUpload";
import FileUploadBtn from "./FileUploadBtn";
import FileDownload from "./FileDownload";
import ShareLink from "./ShareLink";
import { useSearchParams } from "next/navigation";

const ShareCard = () => {
  const userDetails = useSocket();
  const [partnerId, setpartnerId] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const [isCopied, setisCopied] = useState(false);
  const [currentConnection, setcurrentConnection] = useState(false);
  const peerRef = useRef<any>();
  const [userId, setuserId] = useState<any>();
  const [signalingData, setsignalingData] = useState<any>();
  const [acceptCaller, setacceptCaller] = useState(false);
  const [terminateCall, setterminateCall] = useState(false);
  const [fileUpload, setfileUpload] = useState<any>();
  const fileInputRef = useRef<any>();
  const [downloadFile, setdownloadFile] = useState<any>();
  const [fileUploadProgress, setfileUploadProgress] = useState<number>(0);
  const [fileDownloadProgress, setfileDownloadProgress] = useState<number>(0);
  const [fileNameState, setfileNameState] = useState<any>();
  const [fileSending, setfileSending] = useState(false);
  const [fileReceiving, setfileReceiving] = useState(false);
  const [name, setname] = useState<any>();
  const searchParams = useSearchParams();

  // used web worker for expensive work
  const workerRef = useRef<Worker>();

  const addUserToSocketDB = () => {
    // console.log("add user");
    userDetails.socket.on("connect", () => {
      // console.log(userDetails.socket.id, userDetails.userId);
      setuserId(userDetails.userId);
      userDetails.socket.emit("details", {
        socketId: userDetails.socket.id,
        uniqueId: userDetails.userId,
      });
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
    // @ts-ignore test
    workerRef.current = new Worker(
      new URL("../utils/worker.ts", import.meta.url)
    );

    addUserToSocketDB();

    if (searchParams.get("code")) {
      setpartnerId(String(searchParams.get("code")));
    }

    userDetails.socket.on("signaling", (data: any) => {
      // console.log(data);
      setacceptCaller(true);
      setsignalingData(data);
      setpartnerId(data.from);
    });

    workerRef.current?.addEventListener("message", (event: any) => {
      if (event.data?.progress) {
        // console.log(event.data.progress);
        setfileDownloadProgress(Number(event.data.progress));
      } else if (event.data?.blob) {
        setdownloadFile(event.data?.blob);
        // Reset progress on the receiver's side
        setfileDownloadProgress(0);
        setfileReceiving(false);
        // console.log(event.data?.blob);
        // console.log(event.data?.timeTaken);
        // console.log(fileNameState);
      }
    });
    console.log(userDetails.socket);

    return () => {
      peerRef.current?.destroy();
      if (peerRef.current) {
        setacceptCaller(false);
        setacceptCaller(false);
        userDetails.socket.off();
      }
      workerRef.current?.terminate();
    };
  }, []);

  const callUser = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
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
      // console.log(data);

      // Parse received data
      const parsedData = JSON.parse(data);

      if (parsedData.chunk) {
        setfileReceiving(true);
        // Handle the received chunk
        handleReceivingData(parsedData.chunk);
      } else if (parsedData.done) {
        // Handle the end of the file transfer
        handleReceivingData(parsedData);
        toast.success("File received successfully");
      } else if (parsedData.info) {
        handleReceivingData(parsedData);
      }
    });

    //receive accept signal via socket
    userDetails.socket.on("callAccepted", (data: any) => {
      peer.signal(data.signalData);
      setisLoading(false);
      setcurrentConnection(true);
      setterminateCall(true);
      toast.success(`Successful connection with ${partnerId}`);
      userDetails.setpeerState(peer);
    });

    peer.on("close", () => {
      // console.log(`${partnerId} disconnected`);
      // Handle the disconnection, e.g., remove UI elements, update state, etc.
      setpartnerId("");
      setcurrentConnection(false);
      toast.error(`${partnerId} disconnected`);
      setfileUpload(false);
      setterminateCall(false);
      setpartnerId("");
      userDetails.setpeerState(undefined);
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
    userDetails.setpeerState(peer);
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
        setfileReceiving(true);
        // Handle the received chunk
        handleReceivingData(parsedData.chunk);
      } else if (parsedData.done) {
        // Handle the end of the file transfer
        handleReceivingData(parsedData);
        toast.success("File received successfully");
      } else if (parsedData.info) {
        handleReceivingData(parsedData);
      }
    });

    //verify the signal of the caller
    peer.signal(signalingData.signalData);

    peer.on("close", () => {
      // console.log(`${partnerId} disconnected`);
      // Handle the disconnection, e.g., remove UI elements, update state, etc.
      setpartnerId("");
      setcurrentConnection(false);
      toast.error(`${partnerId} disconnected`);
      setfileUpload(false);
      setterminateCall(false);
      setpartnerId("");
      userDetails.setpeerState(undefined);
    });

    peer.on("error", (err) => {
      console.log(err);
    });
  };

  const handleConnectionMaking = () => {
    setisLoading(true);
    if (partnerId && partnerId.length == 10) {
      callUser();
    } else {
      setisLoading(false);
      toast.error("Enter correct Peer's Id");
    }
  };

  const handleFileUploadBtn = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e: any) => {
    setfileUpload(e.target.files);
    // console.log(fileUpload);
  };

  function handleReceivingData(data: any) {
    if (data.info) {
      workerRef.current?.postMessage({
        status: "fileInfo",
        fileSize: data.fileSize,
      });
      setfileNameState(data.fileName);
      setname(data.fileName);
      // console.log(data.fileName);
    } else if (data.done) {
      const parsed = data;
      // setfileNameState(parsed.fileName);
      const fileSize = parsed.fileSize;
      workerRef.current?.postMessage("download");
    } else {
      setdownloadFile("sjdf");
      workerRef.current?.postMessage(data);
    }
  }

  const handleWebRTCUpload = () => {
    const peer = peerRef.current;
    const file = fileUpload[0];
    const chunkSize = 16 * 1024; // 16 KB chunks (you can adjust this size)
    let offset = 0;

    const readAndSendChunk = () => {
      const chunk = file.slice(offset, offset + chunkSize);
      // console.log(offset, chunkSize + offset);

      const reader = new FileReader();

      if (offset == 0) {
        setfileSending(true);
        const fileInfo = {
          info: true,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };
        peer.write(JSON.stringify(fileInfo));
      }

      reader.onload = (event) => {
        if (event.target?.result) {
          const chunkData: any = event.target.result;
          const uint8ArrayChunk = new Uint8Array(chunkData);

          // Send the chunk data along with the progress information
          const progressPayload = {
            chunk: Array.from(uint8ArrayChunk),
            progress: (offset / file.size) * 100,
          };
          // console.log(progressPayload);
          peer.write(JSON.stringify(progressPayload));
          setfileUploadProgress((offset / file.size) * 100);

          offset += chunkSize;

          if (offset < file.size) {
            readAndSendChunk(); // Continue reading and sending chunks
          } else {
            // Signal the end of the file transfer
            peer.write(
              JSON.stringify({
                done: true,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
              })
            );
            setfileUploadProgress(100);
            setfileSending(false);
            toast.success("Sended file successfully");
          }
        }
      };

      // If the chunk size is greater than the remaining file size, read the entire remaining file
      reader.readAsArrayBuffer(chunk);
    };

    readAndSendChunk();
  };

  return (
    <>
      <Card className="sm:max-w-[450px] max-w-[95%]">
        {/* <CardHeader></CardHeader> */}
        <CardContent className="mt-8">
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col gap-y-1">
                <Label htmlFor="name">My ID</Label>
                <div className="flex flex-row justify-left items-center space-x-2">
                  <div className="flex border rounded-md px-3 py-2 text-sm h-10 w-full bg-muted">
                    {userId ? userId : "Loading..."}
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    className="p-4"
                    onClick={() => CopyToClipboard(userDetails?.userId)}
                    disabled={userId ? false : true}
                  >
                    {isCopied ? (
                      <Check size={15} color="green" />
                    ) : (
                      <CopyIcon size={15} />
                    )}
                  </Button>
                  <ShareLink userCode={userId} />
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label htmlFor="name">Peer`s ID</Label>
                <div className="flex flex-row justify-left items-center space-x-2">
                  <Input
                    id="name"
                    placeholder="ID"
                    onChange={(e) => setpartnerId(e.target.value)}
                    disabled={terminateCall}
                    value={partnerId}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    className="flex items-center justify-center p-4 w-[160px]"
                    onClick={handleConnectionMaking}
                    disabled={terminateCall}
                  >
                    {isLoading ? (
                      <>
                        <div className="scale-0 hidden dark:flex dark:scale-100">
                          <TailSpin color="white" height={18} width={18} />
                        </div>
                        <div className="scale-100 flex dark:scale-0 dark:hidden">
                          <TailSpin color="black" height={18} width={18} />
                        </div>
                      </>
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
                        variant="destructive"
                        type="button"
                        // className="p-4 w-[160px] text-red-600 border-red-400 hover:bg-red-300 animate-in slide-in-from-right-[30px]"
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
                <>
                  <FileDownload
                    fileName={fileNameState}
                    fileReceivingStatus={fileReceiving}
                    fileProgress={fileDownloadProgress}
                    fileRawData={downloadFile}
                  />
                </>
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
                Click here to receive call from {signalingData.from}
              </Button>
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </>
  );
};

export default ShareCard;
