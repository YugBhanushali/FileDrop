"use client";
import { useSocket } from "@/context/SocketProvider";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import ShareCard from "./ShareCard";

const Share = () => {
  const socket = useSocket();
  
  return (
    <>
      <div className="flex flex-row m-[100px]">
        <ShareCard />
      </div>
    </>
  );
};

export default Share;
