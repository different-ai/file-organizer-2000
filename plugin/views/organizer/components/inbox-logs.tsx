import * as React from "react";
import FileOrganizer from "../../../index";
import { FileRecord, FileStatus } from "../../../inbox/types";
import moment from "moment";
import { ChevronDown, Search, ExternalLink } from "lucide-react";
import { App, TFile } from "obsidian";
import { motion, AnimatePresence } from "framer-motion";
import { logMessage } from "../../../someUtils";

interface InboxLogsProps {
  plugin: FileOrganizer & {
    inbox: {
      getAllFiles: () => FileRecord[];
      getQueueStats: () => {
        queued: number;
        processing: number;
        completed: number;
        bypassed: number;
        errors: number;
      };
    };
    app: App;
  };
}

function calculateStatsFromRecords(records: FileRecord[]) {
  return records.reduce(
    (acc, record) => {
      acc[record.status]++;
      return acc;
    },
    {
      queued: 0,
      processing: 0,
      completed: 0,
      bypassed: 0,
      error: 0,
    }
  );
}

export const InboxLogs: React.FC<InboxLogsProps> = ({ plugin }) => {
  const [files, setFiles] = React.useState<FileRecord[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof FileRecord;
    direction: "asc" | "desc";
  }>({
    key: "updatedAt",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredAndSortedFiles = React.useMemo(() => {
    return files
      .filter(file => {
        const matchesSearch =
          file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.status.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || file.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (!aValue || !bValue) return 0;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [files, sortConfig, searchTerm, statusFilter]);

  React.useEffect(() => {
    const updateFiles = () => {
      const allFiles = plugin.inbox.getAllFiles();
      setFiles(prevFiles => {
        if (JSON.stringify(prevFiles) !== JSON.stringify(allFiles)) {
          return allFiles;
        }
        return prevFiles;
      });
    };

    updateFiles();
    const interval = setInterval(updateFiles, 100);
    return () => clearInterval(interval);
  }, [plugin]);
  React.useEffect(() => {
    logMessage("files", files);
  }, [files]);

  const getStatusBadgeClass = (status: FileStatus) => {
    const baseClasses =
      "px-2 py-1 rounded-full text-sm font-medium whitespace-nowrap";
    const statusColors = {
      queued:
        "bg-opacity-20 text-[--text-warning] border border-[--text-warning]",
      processing:
        "bg-opacity-20 text-[--text-accent] border border-[--text-accent]",
      completed:
        "bg-opacity-20 text-[--text-success] border border-[--text-success]",
      error: "bg-opacity-20 text-[--text-error] border border-[--text-error]",
      bypassed:
        "bg-opacity-20 text-[--text-muted] border border-[--text-muted]",
    } as const;

    return `${baseClasses} ${statusColors[status] || ""}`;
  };

  const stats = React.useMemo(() => {
    return calculateStatsFromRecords(files);
  }, [files]);

  const nameTransitionVariants = {
    initial: { 
      opacity: 1,
    },
    renamed: {
      opacity: 0.8,
      textDecoration: "line-through",
    },
  };

  return (
    <div className="p-4">
      {/* Header with stats - numbers are now derived from records */}
      <div className="bg-[--background-primary] border border-[--background-modifier-border-focus] rounded-lg p-4 mb-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-[--text-warning] text-2xl font-bold">
              {stats.queued}
            </div>
            <div className="text-[--text-muted] text-sm">Queued</div>
          </div>
          <div className="text-center">
            <div className="text-[--text-accent] text-2xl font-bold">
              {stats.processing}
            </div>
            <div className="text-[--text-muted] text-sm">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-[--text-success] text-2xl font-bold">
              {stats.completed}
            </div>
            <div className="text-[--text-muted] text-sm">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-[--text-muted] text-2xl font-bold">
              {stats.bypassed}
            </div>
            <div className="text-[--text-muted] text-sm">Bypassed</div>
          </div>
          <div className="text-center">
            <div className="text-[--text-error] text-2xl font-bold">
              {stats.error}
            </div>
            <div className="text-[--text-muted] text-sm">Errors</div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[--text-muted]"
            size={16}
          />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded bg-[--background-modifier-form-field] border border-[--background-modifier-border] text-[--text-normal]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded bg-[--background-modifier-form-field] border border-[--background-modifier-border] text-[--text-normal]"
        >
          <option value="all">All Status</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="bypassed">Bypassed</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* File cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAndSortedFiles.map(file => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[--background-primary] border border-[--background-modifier-border] rounded-lg w-full"
            >
              <div className="p-4">
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="font-medium truncate"
                      animate={file.newName ? "renamed" : "initial"}
                      variants={nameTransitionVariants}
                      title={file.fileName}
                    >
                      {file.fileName}
                    </motion.div>

                    {file.newName && (
                      <>
                        <svg
                          className="w-4 h-4 text-[--text-muted]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <a
                          href="#"
                          onClick={() => {
                            plugin.app.workspace.openLinkText(
                              file.newName || "",
                              file.newPath || ""
                            );
                          }}
                          className="text-[--text-accent] underline hover:text-[--text-accent-hover] cursor-pointer"
                        >
                          {file.newName}
                        </a>
                      </>
                    )}
                  </div>

                  <div className="text-sm text-[--text-muted] mt-1">
                    {moment(file.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm text-[--text-muted]">
                      Project folder:
                    </div>
                    <div
                      className="text-sm truncate"
                      title={file.newPath || "Not set"}
                    >
                      {file.newPath || "—"}
                    </div>
                  </div>

                  <div className={getStatusBadgeClass(file.status)}>
                    {file.status}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAndSortedFiles.length === 0 && (
        <div className="text-center py-8 text-[--text-muted]">
          Drag files in the inbox to automatically organize them.
        </div>
      )}
    </div>
  );
};
