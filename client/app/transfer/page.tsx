import Share from "@/components/Share";
import { SocketProvider } from "@/context/SocketProvider";
import React from "react";
import { Toaster } from "react-hot-toast";

const page = () => {
  return (
    <SocketProvider>
      <Share />
      <Toaster />
    </SocketProvider>
  );
};

export default page;
