import { cn } from "../../../../lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const variants = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", variants[status])}>
      {status}
    </span>
  );
}
