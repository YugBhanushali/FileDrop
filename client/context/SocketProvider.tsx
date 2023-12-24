"use client";
import { nanoid } from "nanoid";
import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client/debug";

const SocketContext = createContext<any>({});

export const useSocket = () => {
  const socket: { socket: Socket; userId: string,SocketId:any,setSocketId:any } = useContext(SocketContext);
  return socket;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useMemo(() => {
    
    return io("http://localhost:8000/");
  }, []);
  const [SocketId, setSocketId] = useState<any>(socket)
  const userId = nanoid(10);
  return (
    <SocketContext.Provider value={{ socket, userId,SocketId,setSocketId }}>
      {children}
    </SocketContext.Provider>
  );
};
