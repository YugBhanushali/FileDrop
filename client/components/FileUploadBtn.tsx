import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { File } from "lucide-react";

type fileUploadBtn = {
  inputRef: any;
  handleFileChange: any;
  uploadBtn: any;
};
const FileUploadBtn = ({
  inputRef,
  handleFileChange,
  uploadBtn,
}: fileUploadBtn) => {
  return (
    <>
      <Input
        type="file"
        style={{ display: "none" }}
        ref={inputRef}
        onChange={(e) => handleFileChange(e)}
      />
      <Button
        variant="outline"
        type="button"
        onClick={uploadBtn}
        className=" flex gap-x-2"
      >
        <File size={15} />
        Select File
      </Button>
    </>
  );
};

export default FileUploadBtn;
