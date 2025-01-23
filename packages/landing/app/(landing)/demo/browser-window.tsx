"use client";

import React, { type FC, type PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, RefreshCw, Plus, Menu } from "lucide-react";

interface BrowserWindowProps extends PropsWithChildren {
  // Add any additional props here
}

export const BrowserWindow: FC<BrowserWindowProps> = ({ children }) => {

  return (
    <div className="rounded-lg overflow-hidden shadow-xl border border-gray-600 shadow-gray-900 ">
      <div className="p-2 flex items-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex-grow flex items-center space-x-2 px-2">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
 
        </div>
      </div>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-16 flex flex-col items-center py-4 space-y-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Menu className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border "
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        {/* Main content */}
        <div className="flex-1 p-4">{children}</div>
      </div>
    </div>
  );
};
