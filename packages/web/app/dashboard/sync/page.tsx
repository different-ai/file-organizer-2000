import * as React from "react";
import { FileList } from "./_components/FileList";

export default function SyncDashboard() {
  return (
    <div className="container max-w-7xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Note Companion Sync</h1>
        <p className="text-muted-foreground">Manage your uploaded files</p>
      </header>
      
      <FileList />
    </div>
  );
}
