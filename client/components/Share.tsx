"use client";
import { useSocket } from "@/context/SocketProvider";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import ShareCard from "./ShareCard";
import Chat from "./Chat";

const Share = () => {
  const socket = useSocket();
  
  return (
    <>
      <div className="flex flex-row m-[100px] gap-x-2 justify-center">
        <ShareCard />
        <Chat/>
      </div>
    </>
  );
};

export default Share;
