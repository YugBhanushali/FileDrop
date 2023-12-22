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
import { Check, CopyIcon } from "lucide-react";
import { useSocket } from "@/context/SocketProvider";
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner";
import Peer from "simple-peer";

const ShareCard = () => {
  const userDetails = useSocket();
  const [partnerId, setpartnerId] = useState("");
  const [isLoading, setisLoading] = useState(false);
  const [isCopied, setisCopied] = useState(false);
  const [currentConnection, setcurrentConnection] = useState(false);
  const peerRef = useRef<any>();
  const [signalingData, setsignalingData] = useState<any>();
  const [acceptCaller, setacceptCaller] = useState(false);

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

    addUserToSocketDB()

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

    //receive accept signal via socket
    userDetails.socket.on("callAccepted", (data: any) => {
      peer.signal(data.signalData);
      setisLoading(false);
      setcurrentConnection(true)
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
      setcurrentConnection(true)
      setacceptCaller(false)
    });

    //verify the signal of the caller
    peer.signal(signalingData.signalData);
  };

  const handleConnectionMaking = () => {
    setisLoading(true);
    callUser();
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
                  <Input id="name" placeholder="ID" onChange={(e)=>setpartnerId(e.target.value)}/>
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
                    {acceptCaller ? (
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
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
          <div className="rounded-full bg-green-600 h-2 w-2 animate-ping">
            <div className="rounded-full bg-green-600 h-1 w-1"></div>
          </div>
        </CardFooter>
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
