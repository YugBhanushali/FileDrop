import React from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { saveAs } from "file-saver";
import { Progress } from "./ui/progress";
import { truncateString } from "@/utils/funtions";

type fileDownloadProps = {
  fileReceivingStatus: boolean;
  fileName: string;
  fileProgress: number;
  fileRawData: any;
};

const FileDownload = ({
  fileName,
  fileProgress,
  fileReceivingStatus,
  fileRawData,
}: fileDownloadProps) => {
  const handleFileDownload = (fileRawData: any, tempFile: any) => {
    const blob = fileRawData;
    saveAs(blob, tempFile);
  };
  return (
    <>
      <div className="flex flex-col border rounded-lg  px-3 py-3 w-full gap-y-2">
        <div>
          <Label className=" font-semibold text-[16px]">Download</Label>
        </div>
        <div className="flex flex-col border rounded-lg  px-3 py-3 text-sm w-full gap-y-2">
          <div className="flex justify-between items-center">
            <div className="flex">
              {fileReceivingStatus ? "Receiving..." : truncateString(fileName)}
            </div>
            <div className="flex">
              <Button
                type="button"
                variant="outline"
                className="h-[30px] px-2"
                onClick={() => handleFileDownload(fileRawData, fileName)}
              >
                <Download size={15} />
              </Button>
            </div>
          </div>

          {fileReceivingStatus ? (
            <div>
              <Progress value={fileProgress} className="h-1" />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default FileDownload;
