import * as React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { UploadedFile } from "@/drizzle/schema";

interface FileCardProps {
  file: UploadedFile;
  onDelete: (id: number) => void;
  onView: (file: UploadedFile) => void;
}

export function FileCard({ file, onDelete, onView }: FileCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-medium leading-none">{file.originalName}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date(file.createdAt))}
            </p>
          </div>
          <StatusBadge status={file.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-sm text-muted-foreground">
          <p>Type: {file.fileType}</p>
          {file.textContent && (
            <p className="mt-2 line-clamp-2">{file.textContent}</p>
          )}
          {file.error && (
            <p className="mt-2 text-red-600 text-sm">{file.error}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(file)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(file.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
