'use client'
import * as React from "react";
import { useState, useEffect } from "react";
import { FileCard } from "./FileCard";
import type { UploadedFile } from "@/drizzle/schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getFiles, deleteFile } from "../actions";

interface FileListProps {
  pageSize?: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function FileList({ pageSize = 10 }: FileListProps) {
  const [page, setPage] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use server action instead of fetch
      const result = await getFiles({ page, limit: pageSize });
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      setFiles(result.files as UploadedFile[]);
      setPagination(result.pagination);
    } catch (err) {
      setError("Failed to load files. Please try again.");
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [page, pageSize]);

  const handleDelete = async (id: number) => {
    try {
      // Use server action instead of fetch
      const result = await deleteFile(id);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete file");
      }
      
      // Refresh the file list
      fetchFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      // Show error toast or message
    }
  };

  const handleView = (file: UploadedFile) => {
    // Open file preview or download
    window.open(file.blobUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchFiles}>Try Again</Button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <p className="text-muted-foreground">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onDelete={handleDelete}
            onView={handleView}
          />
        ))}
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
