import * as React from "react";
import {
  FileRecord,
  LogEntry,
  Step,
} from "../../../inbox/services/record-manager";
import moment from "moment";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlugin } from "../provider";

// Simple log entry display component
const LogEntryDisplay: React.FC<{ entry: LogEntry }> = ({ entry }) => {
  const getStatusColor = (type: "log" | "error") => {
    return type === "error" ? "text-[--text-error]" : "text-[--text-normal]";
  };

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-[--text-muted] w-20 text-xs">
        {moment(entry.timestamp).format("HH:mm:ss")}
      </span>
      <span className="text-sm capitalize">{entry.step}</span>
      <span className={`text-xs ${getStatusColor(entry.type)}`}>
        {entry.message}
        {entry.error && ` - ${entry.error.message}`}
      </span>
    </div>
  );
};

// Main file card component
function FileCard({ record }: { record: FileRecord }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <motion.div
      layout
      className="bg-[--background-primary] border border-[--background-modifier-border] rounded-lg"
    >
      <div className="p-4">
        {/* Basic file info */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[--text-normal]">{record.id}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[--text-muted]"
          >
            <ChevronDown
              className={`w-4 h-4 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Always visible info */}
        <div className="space-y-2">
          {record.classification && (
            <div className="text-sm">
              Classification:{" "}
              <span className="text-[--text-accent]">
                {record.classification}
              </span>
            </div>
          )}
          {record.tags.length > 0 && (
            <div className="flex gap-1">
              {record.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-[--background-secondary] rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-2 border-t border-[--background-modifier-border] pt-4"
            >
              {/* Path info */}
              {record.newPath && (
                <div className="text-sm">
                  New path:{" "}
                  <span className="text-[--text-accent]">{record.newPath}</span>
                </div>
              )}
              {record.newName && (
                <div className="text-sm">
                  New name:{" "}
                  <span className="text-[--text-accent]">{record.newName}</span>
                </div>
              )}

              {/* Logs grouped by step */}
              <div className="space-y-4">
                {Object.values(Step).map(step => {
                  const stepLogs = record.logs.filter(log => log.step === step);
                  if (stepLogs.length === 0) return null;

                  return (
                    <div key={step} className="space-y-1">
                      <h4 className="text-sm font-medium text-[--text-muted] capitalize">
                        {step}
                      </h4>
                      {stepLogs.map((entry, i) => (
                        <LogEntryDisplay key={i} entry={entry} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Main component
export const InboxLogs: React.FC = () => {
  const plugin = usePlugin();
  const [records, setRecords] = React.useState<FileRecord[]>([]);

  React.useEffect(() => {
    // Initial fetch
    const fetchRecords = () => {
      const files = plugin.inbox.getAllFiles();
      setRecords(files);
    };

    fetchRecords();

    // Set up interval
    const intervalId = setInterval(fetchRecords, 1000);

    // Cleanup function
    return () => clearInterval(intervalId);
  }, [plugin.inbox]); // Only depend on plugin.inbox

  return (
    <div className="space-y-4">
      {records?.map(record => (
        <FileCard key={record.id} record={record} />
      ))}
      {records?.length === 0 && (
        <div className="text-center py-8 text-[--text-muted]">
          No records found
        </div>
      )}
    </div>
  );
};
