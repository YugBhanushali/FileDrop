import React from "react";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { Progress } from "./ui/progress";
import { truncateString } from "@/utils/funtions";

type fileUploadProps = {
  fileName: string;
  fileProgress: number;
  handleClick: any;
  showProgress: boolean;
};

const FileUpload = ({
  fileName,
  fileProgress,
  handleClick,
  showProgress,
}: fileUploadProps) => {
  return (
    <div className="flex flex-col border rounded-lg  px-3 py-3 text-sm w-full gap-y-2">
      <div className="flex justify-between items-center">
        <div className="flex">{truncateString(fileName)}</div>
        <div className="flex">
          <Button
            type="button"
            variant="outline"
            className="h-[30px] px-2"
            onClick={() => {
              handleClick();
            }}
          >
            <Upload size={15} />
          </Button>
        </div>
      </div>

      {showProgress ? (
        <div>
          <Progress value={fileProgress} className="h-1" />
        </div>
      ) : null}
    </div>
  );
};

export default FileUpload;
