import Share from "@/components/Share";
import { SocketProvider } from "@/context/SocketProvider";
import React from "react";
import { Toaster } from "react-hot-toast";

const page = () => {
  return (
    <>
      <Share />
      <Toaster />
    </>
  );
};

export default page;
