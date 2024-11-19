import { Button } from "../button";

interface AddCurrentFileButtonProps {
  onAddCurrentFile: () => void;
}

export function AddCurrentFileButton({ onAddCurrentFile }: AddCurrentFileButtonProps) {
  return (
    <Button
      onClick={onAddCurrentFile}
      className="bg-[--interactive-normal] hover:bg-[--interactive-hover] text-[--text-normal]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 mr-2"
      >
        <path
          fillRule="evenodd"
          d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
          clipRule="evenodd"
        />
      </svg>
      Add Current File
    </Button>
  );
} 