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
      <div className="flex flex-wrap m-[100px] gap-x-2 justify-center gap-y-3">
        <ShareCard />
        <Chat/>
      </div>
    </>
  );
};

export default Share;
