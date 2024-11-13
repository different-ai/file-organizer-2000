import * as React from "react";
import FileOrganizer from "../../../index";
import { FileRecord, FileStatus } from "../../../inbox/types";
import moment from "moment";
import { ChevronDown, Search, ExternalLink } from "lucide-react";
import { App, TFile } from "obsidian";
import { motion, AnimatePresence } from "framer-motion";
import { logMessage } from "../../../someUtils";
import { usePlugin } from "../provider";
import { logger } from "../../../services/logger";

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

// Replace FileDetails component with ActionLog component
const ActionLog: React.FC<{ record: FileRecord }> = ({ record }) => {
  if (!record.actions?.length) return null;

  return (
    <div className="p-4 space-y-2 bg-[--background-primary] rounded-lg overflow-x-auto">
      {record.actions.map((action, index) => (
        <div key={index} className="flex items-start gap-3 text-sm">
          <div className="w-20 text-[--text-muted]">
            {moment(action.timestamp).format("HH:mm:ss")}
          </div>

          <div className="flex-1">
            {action.action === "renamed" && (
              <div className="flex items-center gap-2">
                <span>Renamed from</span>
                <code className="px-1 bg-[--background-primary] rounded">
                  {action.details.from}
                </code>
                <span>to</span>
                <code className="px-1 bg-[--background-primary] rounded">
                  {action.details.to}
                </code>
              </div>
            )}

            {action.action === "moved" && (
              <div className="flex items-center gap-2">
                <span>Moved to</span>
                <code className="px-1 bg-[--background-primary] rounded">
                  {action.details.to}
                </code>
              </div>
            )}

            {action.action === "classified" && (
              <div className="flex items-center gap-2">
                <span>Classified as</span>
                <code className="px-1 bg-[--background-primary] rounded">
                  {action.details.classification?.documentType}
                </code>
              </div>
            )}

            {action.action === "tagged" && (
              <div className="flex items-center gap-2">
                <span>Added tags</span>
                <div className="flex gap-1">
                  {action.details.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[--background-primary] rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {action.action === "error" && (
              <div className="text-[--text-error]">{action.details.error}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

function FileCard({ file }: { file: FileRecord }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const plugin = usePlugin();

  // Status indicator colors without text
  const getStatusColor = (status: FileStatus) => {
    const colors = {
      queued: "bg-[--text-warning]",
      processing: "bg-[--text-accent]",
      completed: "bg-[--text-success]",
      error: "bg-[--text-error]",
      bypassed: "bg-[--text-muted]",
    } as const;
    return colors[status] || "";
  };

  return (
    <motion.div
      layout
      className="bg-[--background-primary] border border-[--background-modifier-border] rounded-lg w-full"
    >
      <div className="p-4 relative">
        {/* Status indicator dot */}
        <div
          className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${getStatusColor(
            file.status
          )}`}
        />

        {/* Main content */}
        <div className="pr-8">
          {/* Filename section */}
          <div className="flex items-center gap-2 mb-3">
            {file.newName && file.newName !== file.fileName ? (
              <div className="flex items-center gap-2">
                <span className="text-[--text-muted] line-through">
                  {file.fileName}
                </span>
                <span className="text-[--text-accent]">→</span>
                <span
                  className="text-[--text-accent] cursor-pointer hover:underline"
                  onClick={() =>
                    plugin.app.workspace.openLinkText(
                      file.newName,
                      file.newPath
                    )
                  }
                >
                  {file.newName}
                </span>
              </div>
            ) : (
              <span
                className="text-[--text-accent] cursor-pointer hover:underline"
                onClick={() =>
                  plugin.app.workspace.openLinkText(file.fileName, file.path)
                }
              >
                {file.fileName}
              </span>
            )}
          </div>

          {/* Expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[--text-muted] hover:text-[--text-normal] text-sm"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
            {isExpanded ? "Less details" : "More details"}
          </button>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-4 border-t border-[--background-modifier-border] pt-4"
            >
              {/* Classification */}
              {file.classification && (
                <div className="flex items-center gap-2">
                  <span className="text-[--text-muted] text-sm">AI Template:</span>
                  <span
                    className="text-sm cursor-pointer hover:text-[--text-accent]"
                    onClick={() => {
                      // Add your classification click handler here
                      plugin.app.workspace.openLinkText(
                        file.classification.documentType,
                        plugin.settings.templatePaths
                      );
                      console.log(
                        "Classification clicked:",
                        file.classification
                      );
                    }}
                  >
                    {file.classification.documentType}
                    <span className="ml-2 text-[--text-muted]">
                      ({file.classification.confidence}% confidence)
                    </span>
                  </span>
                </div>
              )}

              {/* Destination folder */}
              {file.destinationFolder && (
                <div className="flex items-center gap-2">
                  <span className="text-[--text-muted] text-sm">Location:</span>
                  <span className="text-sm">{file.destinationFolder}</span>
                </div>
              )}

              {/* Tags */}
              {file.tags && file.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[--text-muted] text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-[--background-secondary] rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action log */}
              <ActionLog record={file} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
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

  const stats = React.useMemo(() => {
    return calculateStatsFromRecords(files);
  }, [files]);

  return (
    <div className="">
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
            <FileCard key={file.id} file={file} />
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
