import React from "react";
import { Button } from "./button";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import InfoToolTip from "./InfoToolTip";

const Home = () => {
  return (
    <div className="flex flex-col mt-[30vh] justify-center items-center">
      <h1 className="sm:text-3xl text-xl sm:w-[410px] text-center font-extrabold tracking-wide">
        {/* Share your files 📁 by making P2P 🤝 connection and you can chat 💬 too. */}
        Share Files Seamlessly 🌐, Connect P2P 🤝, and Chat Instantly 💬 with
        FileDrop!
      </h1>
      <InfoToolTip />
      <Link href="/transfer">
        <Button variant="outline">Get Started <ArrowRight className="ml-1" size={18}/></Button>
      </Link>
    </div>
  );
};

export default Home;
