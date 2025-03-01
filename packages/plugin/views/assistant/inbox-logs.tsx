import * as React from "react";
import {
  FileRecord,
  LogEntry,
  Action,
  FileStatus,
} from "../../inbox/services/record-manager";
import moment from "moment";
import {
  ChevronDown,
  Clock,
  Play,
  Check,
  AlertCircle,
  Ban,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlugin } from "./provider";
import { Inbox } from "../../inbox";

// Add a tooltip component for error details
const ErrorTooltip: React.FC<{ error: LogEntry["error"] }> = ({
  error,
  children,
}) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
        <div className="bg-[--background-modifier-error] text-[--text-on-accent] p-3 rounded-lg shadow-lg whitespace-pre-wrap max-w-md">
          <div className="font-medium mb-1">Error Details</div>
          <div className="text-sm">{error.message}</div>
          {error.stack && (
            <div className="mt-2 text-xs opacity-80 font-mono">
              {error.stack}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Function to get detailed display text based on action and details
const getDisplayText = (step: Action, details?: Record<string, any>): string => {
  switch (step) {
    // File type detection
    case Action.VALIDATE:
      return "Validating file type";
    case Action.VALIDATE_DONE:
      return details?.fileType
        ? `Recognized file type as "${details.fileType}"`
        : "File type validated";
    
    // Reading / Extraction
    case Action.EXTRACT:
      return details?.fileType
        ? `Extracting text from ${details.fileType}`
        : "Extracting text";
    case Action.EXTRACT_DONE:
      return details?.charCount
        ? `Extracted ${details.charCount} characters of text`
        : "Text extracted";
    
    // Classification
    case Action.CLASSIFY:
      return "Classifying document";
    case Action.CLASSIFY_DONE:
      return details?.classification
        ? `Classified as "${details.classification}"`
        : "Document classified";
    
    // Tagging
    case Action.TAGGING:
      return "Analyzing content for tags";
    case Action.TAGGING_DONE:
      return details?.tags
        ? `Recommended tags: ${details.tags.join(", ")}`
        : "Tags generated";
    case Action.APPLYING_TAGS:
      return "Applying tags to document";
    case Action.APPLYING_TAGS_DONE:
      return details?.tags
        ? `Applied tags: ${details.tags.join(", ")}`
        : "Tags applied";
    
    // Naming
    case Action.RECOMMEND_NAME:
      return "Generating file name";
    case Action.RECOMMEND_NAME_DONE:
      return details?.newName
        ? `Generated file name: "${details.newName}"`
        : "File name generated";
    case Action.APPLYING_NAME:
      return "Renaming file";
    case Action.APPLYING_NAME_DONE:
      if (details?.oldName && details?.newName) {
        return `Renamed from "${details.oldName}" to "${details.newName}"`;
      }
      return "File renamed";
    
    // Formatting
    case Action.FORMATTING:
      return details?.format
        ? `Formatting as "${details.format}" style`
        : "Formatting content";
    case Action.FORMATTING_DONE:
      return details?.format
        ? `Formatted as "${details.format}" style`
        : "Content formatted";
    
    // Moving attachments
    case Action.MOVING_ATTACHMENT:
      return "Processing attachments";
    case Action.MOVING_ATTACHEMENT_DONE:
      return details?.attachments
        ? `Moved ${details.attachments.length} attachment(s) to ${details.destination || "attachments folder"}`
        : "Attachments processed";
    
    // Moving file
    case Action.MOVING:
      return "Finding optimal location";
    case Action.MOVING_DONE:
      return details?.destination
        ? `Moved to ${details.destination}`
        : "File moved to final location";
    
    // Cleanup
    case Action.CLEANUP:
      return "Cleaning up file";
    case Action.CLEANUP_DONE:
      return "File cleaned up";
    
    // Container
    case Action.CONTAINER:
      return "Creating document container";
    case Action.CONTAINER_DONE:
      return "Document container created";
    
    // Append
    case Action.APPEND:
      return "Appending content";
    case Action.APPEND_DONE:
      return "Content appended";
    
    // YouTube
    case Action.FETCH_YOUTUBE:
      return details?.videoId
        ? `Fetching transcript for YouTube video: ${details.videoId}`
        : "Fetching YouTube transcript";
    
    // Completion
    case Action.COMPLETED:
      return `File fully processed at ${moment().format("HH:mm:ss")}`;
    
    // Error states
    case Action.ERROR_VALIDATE:
      return "Error validating file type";
    case Action.ERROR_EXTRACT:
      return "Error extracting content";
    case Action.ERROR_CLASSIFY:
      return "Error classifying document";
    case Action.ERROR_TAGGING:
      return "Error generating tags";
    case Action.ERROR_FORMATTING:
      return "Error formatting content";
    case Action.ERROR_MOVING_ATTACHMENT:
      return "Error moving attachments";
    case Action.ERROR_MOVING:
      return "Error moving file";
    case Action.ERROR_RENAME:
      return "Error renaming file";
    case Action.ERROR_CLEANUP:
      return "Error cleaning up file";
    case Action.ERROR_CONTAINER:
      return "Error creating container";
    case Action.ERROR_APPEND:
      return "Error appending content";
    case Action.ERROR_FETCH_YOUTUBE:
      return "Error fetching YouTube transcript";
    case Action.ERROR_COMPLETE:
      return "Processing failed";
    
    default:
      return step.toString();
  }
};

// Enhanced log entry display component
const LogEntryDisplay: React.FC<{ entry: LogEntry; step: Action; plugin: any }> = ({
  entry,
  step,
  plugin,
}) => {
  const details = entry.details || {};
  const isErrorStep = step.toString().startsWith("ERROR_");
  const hasError = entry.error || isErrorStep;
  
  // Function to handle clicking on a path or file
  const handlePathClick = () => {
    if (details.destination) {
      // For folder paths
      plugin.app.workspace.openLinkText(
        "", // Empty string for the basename when opening a folder
        details.destination
      );
    } else if (details.newName && details.newPath) {
      // For files with both name and path
      plugin.app.workspace.openLinkText(
        details.newName,
        details.newPath
      );
    } else if (details.attachments && details.attachmentPath) {
      // For attachments
      plugin.app.workspace.openLinkText(
        "", // Empty string to just open the folder
        details.attachmentPath
      );
    }
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* Status indicator */}
      <div
        className={`w-2 h-2 rounded-full ${
          hasError
            ? "bg-[--text-error]"
            : entry.skipped
            ? "bg-[--text-muted]"
            : entry.completed
            ? "bg-[--text-success]"
            : "bg-[--text-accent] animate-pulse"
        }`}
      />

      {/* Timestamp */}
      <span className="text-[--text-muted] w-20 text-xs">
        {moment(entry.timestamp).format("HH:mm:ss")}
      </span>

      {/* Step name and details */}
      <div className="flex flex-col">
        <span
          className={`text-sm ${
            hasError 
              ? "text-[--text-error]" 
              : entry.skipped
              ? "text-[--text-muted] line-through"
              : "text-[--text-normal]"
          }`}
        >
          {getDisplayText(step, details)}
          {entry.skipped && " (skipped)"}
        </span>
        
        {/* Clickable paths if available */}
        {(details.destination || details.newPath || details.attachmentPath) && (
          <span
            onClick={handlePathClick}
            className="text-[--text-accent] cursor-pointer text-sm hover:underline"
          >
            {details.destination || details.newPath || details.attachmentPath}
          </span>
        )}
      </div>

      {/* Error display */}
      {entry.error && (
        <ErrorTooltip error={entry.error}>
          <div className="flex items-center gap-1 text-[--text-error] text-sm ml-auto">
            <AlertCircle className="w-4 h-4" />
            <span className="truncate max-w-[200px]">
              {entry.error.message}
            </span>
          </div>
        </ErrorTooltip>
      )}
    </div>
  );
};

// Add this helper component for the filename display
const FileNameDisplay: React.FC<{ record: FileRecord }> = ({ record }) => {
  const hasNewName = record.newName && record.originalName !== record.newName;

  if (!hasNewName) {
    return (
      <span className="text-[--text-accent]">
        {record.originalName || "No file"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[--text-muted] line-through">
        {record.originalName}
      </span>
      <span className="text-[--text-muted]">→</span>
      <span className="text-[--text-accent]">{record.newName}</span>
    </div>
  );
};

// Add this helper component for the path display
const PathDisplay: React.FC<{ record: FileRecord }> = ({ record }) => {
  if (!record.newPath) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[--text-muted]">→</span>
      <span className="text-[--text-accent]">{record.newPath}</span>
    </div>
  );
};

// Main file card component
function FileCard({ record }: { record: FileRecord }) {
  const plugin = usePlugin();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Create a stable key for memoization
  const logsKey = React.useMemo(() => {
    return Object.entries(record.logs)
      .map(([action, log]) => `${action}-${log.timestamp}`)
      .join('|');
  }, [record.logs]);

  // Memoize sorted logs using the stable key
  const sortedLogs = React.useMemo(() => {
    return Object.entries(record.logs)
      .sort(([_, a], [__, b]) => 
        moment(b.timestamp).diff(moment(a.timestamp))
      )
      .map(([action, log]) => [action as Action, log] as [Action, LogEntry]);
  }, [logsKey]);

  // Add status indicators - only show when present
  const StatusIndicators = () => {
    const hasStatus = record.classification || record.tags.length > 0;
    if (!hasStatus) return null;

    return (
      <div className="flex items-center gap-2">
        {record.classification && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[--background-modifier-success] text-[--text-on-accent]">
            Classified
          </span>
        )}
        {record.tags.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[--background-modifier-success] text-[--text-on-accent]">
            Tagged
          </span>
        )}
      </div>
    );
  };

  return (
    <motion.div
      layout
      className="bg-[--background-primary] border border-[--background-modifier-border] rounded-lg"
    >
      <div className="p-4">
        {/* File header with status indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="cursor-pointer"
                onClick={() =>
                  plugin.app.workspace.openLinkText(
                    record.file?.basename || "",
                    record.file?.parent?.path || ""
                  )
                }
              >
                <FileNameDisplay record={record} />
              </div>
              <StatusBadge status={record.status} />
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-[--text-muted]"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Status indicators - only shown when present */}
          <StatusIndicators />

          {/* Path display */}
          <PathDisplay record={record} />

          {/* Always visible info - only when present */}
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
              <div className="flex gap-1 flex-wrap">
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
        </div>

        {/* Expanded logs */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-1 border-t border-[--background-modifier-border] pt-4"
            >
              {sortedLogs.map(([action, log]) => (
                <LogEntryDisplay key={action} entry={log} step={action} plugin={plugin} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Status badge component
const StatusBadge: React.FC<{ status: FileStatus }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-[--text-success]";
      case "error":
        return "bg-[--text-error]";
      case "processing":
        return "bg-[--text-accent]";
      default:
        return "bg-[--text-muted]";
    }
  };

  return (
    <span className="inline-flex items-center">
      <span className="sr-only">{status}</span>
      <span
        className={`w-2 h-2 rounded-full ${getStatusColor()}`}
        aria-hidden="true"
      />
    </span>
  );
};

// Analytics component
const InboxAnalytics: React.FC<{
  analytics: ReturnType<typeof Inbox.prototype.getAnalytics>;
}> = ({ analytics }) => {
  const { byStatus } = analytics;

  // Split statuses into main flow and exceptions
  const mainFlow: Array<{
    status: FileStatus;
    icon: React.ReactNode;
  }> = [
    { status: "queued", icon: <Clock className="w-4 h-4" /> },
    { status: "processing", icon: <Play className="w-4 h-4" /> },
    { status: "completed", icon: <Check className="w-4 h-4" /> },
  ];

  const exceptions: Array<{
    status: FileStatus;
    icon: React.ReactNode;
  }> = [
    { status: "error", icon: <AlertCircle className="w-4 h-4" /> },
    { status: "bypassed", icon: <Ban className="w-4 h-4" /> },
  ];

  const StatusBox = ({
    status,
    icon,
  }: {
    status: FileStatus;
    icon: React.ReactNode;
  }) => (
    <div
      key={status}
      className="bg-[--background-primary] p-4 rounded text-center flex flex-col items-center"
    >
      <div className="text-sm capitalize">{status}</div>
      <div className="font-semibold">{byStatus[status] || 0}</div>
      <div className="mt-1 text-[--text-muted]">{icon}</div>
    </div>
  );

  return (
    <div className="bg-[--background-secondary] rounded-lg ">
      <div className="space-y-2">
        {/* Main flow row */}
        <div className="grid grid-cols-3 gap-2">
          {mainFlow.map(({ status, icon }) => (
            <StatusBox key={status.toString()} status={status} icon={icon} />
          ))}
        </div>

        {/* Exceptions row */}
        <div className="grid grid-cols-2 gap-2">
          {exceptions.map(({ status, icon }) => (
            <StatusBox key={status.toString()} status={status} icon={icon} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Update types
type DateRange = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'all' | 'custom';

interface DateFilter {
  range: DateRange;
  startDate: string;
  endDate: string;
}

// Enhanced date filter component
const DateFilterSelect: React.FC<{
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
}> = ({ value, onChange }) => {
  const ranges: Array<{ value: DateRange; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'custom', label: 'Pick date' },
    { value: 'all', label: 'All time' },
  ];

  const getDateRange = (range: DateRange, customDate?: string): { startDate: string; endDate: string } => {
    let end = moment().endOf('day');
    let start = moment().startOf('day');

    switch (range) {
      case 'today':
        break;
      case 'yesterday':
        start = start.subtract(1, 'day');
        end.subtract(1, 'day');
        break;
      case 'last7days':
        start = start.subtract(6, 'days');
        break;
      case 'last30days':
        start = start.subtract(29, 'days');
        break;
      case 'custom':
        if (customDate) {
          start = moment(customDate).startOf('day');
          end = moment(customDate).endOf('day');
        }
        break;
      case 'all':
        start = moment(0);
        break;
    }

    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    };
  };

  const handleRangeChange = (range: DateRange) => {
    const dates = getDateRange(range);
    onChange({
      range,
      ...dates,
    });
  };

  const handleDateChange = (date: string) => {
    const dates = getDateRange('custom', date);
    onChange({
      range: 'custom',
      ...dates,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[--text-muted]" />
        <select
          value={value.range}
          onChange={(e) => handleRangeChange(e.target.value as DateRange)}
          className="pl-2 pr-8 h-min py-2 bg-[--background-secondary] rounded-l border border-[--background-modifier-border] text-sm appearance-none"
        >
          {ranges.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Calendar picker - only shown when 'custom' is selected */}
      {value.range === 'custom' && (
        <input
          type="date"
          value={value.startDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="py-2 pl-6 pr-2 bg-[--background-secondary] rounded-r border border-[--background-modifier-border] text-sm w-min"
          max={moment().format('YYYY-MM-DD')}
        />
      )}
    </div>
  );
};

// Update SearchBar props
interface SearchBarProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: FileStatus | "") => void;
  onDateFilter: (filter: DateFilter) => void;
  selectedStatus: FileStatus | "";
  dateFilter: DateFilter;
}

// Update SearchBar component
const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onStatusFilter,
  onDateFilter,
  selectedStatus,
  dateFilter,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const statuses: Array<FileStatus | ""> = [
    "",
    "queued",
    "processing",
    "completed",
    "error",
    "bypassed",
  ];

  return (
    <div className="bg-[--background-primary] p-4 rounded-lg border border-[--background-modifier-border] space-y-3">
      {/* Search input row */}
      <div className="pl-10 relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[--text-muted]" />
        <input
          type="text"
          placeholder="Search files, tags, or actions..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 h-min py-2 bg-[--background-secondary] rounded border border-[--background-modifier-border] text-sm"
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3">
        <div className="relative w-[200px]">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[--text-muted]" />
          <select
            value={selectedStatus}
            onChange={e => onStatusFilter(e.target.value as FileStatus | "")}
            className="w-full pl-9 pr-4 h-min py-2 bg-[--background-secondary] rounded border border-[--background-modifier-border] text-sm appearance-none"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status
                  ? status.charAt(0).toUpperCase() + status.slice(1)
                  : "All Status"}
              </option>
            ))}
          </select>
        </div>
        <DateFilterSelect 
          value={dateFilter}
          onChange={onDateFilter}
        />
      </div>
    </div>
  );
};

// Main component
export const InboxLogs: React.FC = () => {
  const plugin = usePlugin();
  const [records, setRecords] = React.useState<FileRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = React.useState<FileRecord[]>([]);
  const [analytics, setAnalytics] = React.useState<ReturnType<typeof Inbox.prototype.getAnalytics>>();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FileStatus | "">("");
  const [dateFilter, setDateFilter] = React.useState<DateFilter>({
    range: 'today',
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });

  // Memoize filterRecords to prevent recreation on every render
  const filterRecords = React.useCallback(
    (records: FileRecord[]) => {
      return records.filter(record => {
        const matchesSearch = searchQuery
          .toLowerCase()
          .split(" ")
          .every(
            term =>
              record.file?.basename.toLowerCase().includes(term) ||
              record?.tags.some(tag => tag.toLowerCase().includes(term)) ||
              Object.keys(record.logs).some(action =>
                action.toLowerCase().includes(term)
              ) ||
              record.classification?.toLowerCase().includes(term)
          );

        const matchesStatus = !statusFilter || record.status === statusFilter;

        const matchesDate = dateFilter.range === 'all' || Object.values(record.logs).some(log => {
          const logDate = moment(log.timestamp);
          return logDate.isBetween(
            moment(dateFilter.startDate).startOf('day'),
            moment(dateFilter.endDate).endOf('day'),
            'day',
            '[]'
          );
        });

        return matchesSearch && matchesStatus && matchesDate;
      });
    },
    [searchQuery, statusFilter, dateFilter.range, dateFilter.startDate, dateFilter.endDate]
  );

  // Add a function to check if records have changed
  const haveRecordsChanged = (oldRecords: FileRecord[], newRecords: FileRecord[]): boolean => {
    if (oldRecords.length !== newRecords.length) return true;

    for (let i = 0; i < newRecords.length; i++) {
      const oldRecord = oldRecords[i];
      const newRecord = newRecords[i];

      // Check basic changes (status, name, tags, etc.)
      if (
        oldRecord.status !== newRecord.status ||
        oldRecord.newName !== newRecord.newName ||
        oldRecord.newPath !== newRecord.newPath ||
        oldRecord.tags.length !== newRecord.tags.length
      ) {
        return true;
      }

      // Compare logs thoroughly
      const oldActions = Object.keys(oldRecord.logs);
      const newActions = Object.keys(newRecord.logs);

      if (oldActions.length !== newActions.length) return true;

      for (const action of newActions) {
        const oldLog = oldRecord.logs[action];
        const newLog = newRecord.logs[action];

        if (!oldLog || !newLog) return true;

        // Compare relevant fields
        if (
          oldLog.timestamp !== newLog.timestamp ||
          oldLog.completed !== newLog.completed ||
          oldLog.skipped !== newLog.skipped ||
          oldLog.error?.message !== newLog.error?.message ||
          oldLog.error?.stack !== newLog.error?.stack ||
          JSON.stringify(oldLog.details) !== JSON.stringify(newLog.details)
        ) {
          return true;
        }
      }
    }

    return false;
  };

  // Update filtered records when filters change
  React.useEffect(() => {
    setFilteredRecords(filterRecords(records));
  }, [filterRecords, records]);

  // Fetch data periodically
  React.useEffect(() => {
    const fetchData = () => {
      const newFiles = plugin.inbox.getAllFiles();
      const newAnalytics = plugin.inbox.getAnalytics();
      
      // Only update if something has changed
      if (haveRecordsChanged(records, newFiles)) {
        setRecords(newFiles);
      }
      
      // Update analytics only if they've changed
      if (JSON.stringify(analytics) !== JSON.stringify(newAnalytics)) {
        setAnalytics(newAnalytics);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, [plugin.inbox, records, analytics]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: FileStatus | "") => {
    setStatusFilter(status);
  };

  const handleDateFilter = (filter: DateFilter) => {
    setDateFilter(filter);
  };

  return (
    <div className="space-y-4">
      {analytics && <InboxAnalytics analytics={analytics} />}

      <SearchBar
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onDateFilter={handleDateFilter}
        selectedStatus={statusFilter}
        dateFilter={dateFilter}
      />

      {/* Enhanced date range indicator */}
      {dateFilter.range !== 'all' && (
        <div className="text-sm text-[--text-muted]">
          {dateFilter.range === 'custom' ? (
            <>Showing records for {moment(dateFilter.startDate).format('MMMM D, YYYY')}</>
          ) : (
            <>
              Showing records from{' '}
              {moment(dateFilter.startDate).format('MMM D, YYYY')}
              {dateFilter.startDate !== dateFilter.endDate && 
                ` to ${moment(dateFilter.endDate).format('MMM D, YYYY')}`}
            </>
          )}
        </div>
      )}

      {filteredRecords.map(record => (
        <FileCard key={record.id.toString()} record={record} />
      ))}
      {filteredRecords.length === 0 && (
        <div className="text-center py-8 text-[--text-muted]">
          {records.length === 0 ? "No records found" : "No matching records"}
        </div>
      )}
    </div>
  );
};
