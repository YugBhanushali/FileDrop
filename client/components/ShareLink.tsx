import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Copy, Link2, Share } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";

const ShareLink = ({ userCode }: { userCode: string }) => {
  const { theme } = useTheme();
  const handleCopyClick = () => {
    navigator.clipboard.writeText(
      `https://file-drops.vercel.app/transfer?code=${userCode}`
    );
    toast.success("Link Copied");
  };
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="p-3"
            disabled={userCode ? false : true}
          >
            <Share size={18} />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share link</DialogTitle>
            <DialogDescription>
              Anyone with this link can make a P2P connection with you
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center space-x-2">
            <div className="flex flex-col w-full gap-y-2 justify-center items-center">
              <div className="flex justify-center border rounded-md w-fit p-2">
                <QRCodeSVG
                  value={`https://fast-drop.vercel.app/transfer?code=${userCode}`}
                  size={128}
                  bgColor={theme === "dark" ? "#000000" : "#ffffff"}
                  fgColor={theme === "dark" ? "#ffffff" : "#000000"}
                  level={"L"}
                  includeMargin={false}
                />
              </div>
              <div className="flex w-full justify-center gap-x-1">
                <Input
                  id="link"
                  defaultValue={`https://fast-drop.vercel.app/transfer?code=${userCode}`}
                  readOnly
                />
                <Button
                  type="button"
                  onClick={handleCopyClick}
                  variant={"outline"}
                  className="px-3"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareLink;
