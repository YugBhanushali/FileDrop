"use client";
import { customAlphabet, nanoid } from "nanoid";
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
  const socket: {
    socket: Socket;
    userId: any;
    SocketId: any;
    setSocketId: any;
    peerState: any;
    setpeerState: any;
  } = useContext(SocketContext);
  return socket;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useMemo(() => {
    return io(String(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL));
  }, []);
  const [peerState, setpeerState] = useState<any>();
  const [SocketId, setSocketId] = useState<any>(socket);
  const userId = useMemo(() => {
    return nanoid(10);
  }, []);
  return (
    <SocketContext.Provider
      value={{ socket, userId, SocketId, setSocketId, peerState, setpeerState }}
    >
      {children}
    </SocketContext.Provider>
  );
};
