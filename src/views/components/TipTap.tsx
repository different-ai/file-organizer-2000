"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useCallback } from "react";

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

const Tiptap: React.FC<TiptapProps> = ({ value, onChange, onKeyDown }) => {
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "<p></p>");
    }
  }, [value, editor]);

  return (
    <div className="tiptap-editor" onKeyDown={onKeyDown}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
