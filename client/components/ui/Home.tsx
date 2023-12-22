import React from "react";
import { Button } from "./button";
import Link from "next/link";

const Home = () => {
  return (
    <div className="flex flex-col mt-[40vh] justify-center items-center">
      <h1>Welcome to fast share</h1>
      <Link href="/transfer">
        <Button variant="outline">Get Started</Button>
      </Link>
    </div>
  );
};

export default Home;
