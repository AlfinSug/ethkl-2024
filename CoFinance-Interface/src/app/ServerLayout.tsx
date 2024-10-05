import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Co Finance",
  description: "The next gen DeFi Earning Platform",
};

const ServerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Merge class names conditionally
  const bodyClassName = `${inter.className} ${
    process.env.HIDE_NEXT_ERROR_OVERLAY === "true" ? "hide-nextjs-portal" : ""
  }`;

  return (
    <html lang="en" className="dark">
      <body className={bodyClassName}>
        <div className="relative w-full flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">{children}</main>
        </div>
      </body>
    </html>
  );
};

export default ServerLayout;
