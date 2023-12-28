import React from "react";
import ThemeBtn from "./ThemeBtn";
import { GithubIcon } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
  return (
    <div className="flex justify-center">
      <div className="flex border font-extrabold text-[24px] px-3 py-3 m-2 rounded-lg w-full items-center justify-between">
        <div>FastShare</div>
        <div className="flex gap-x-2">
          <div>
            <Button type="button" className="p-3" variant="ghost">
              <GithubIcon size={18}/>
            </Button>
          </div>
          <div>
            <ThemeBtn />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
