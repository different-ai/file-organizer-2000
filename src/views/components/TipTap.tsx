"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useCallback } from "react";
import { Markdown } from "tiptap-markdown";

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

const Tiptap: React.FC<TiptapProps> = ({ value, onChange, onKeyDown }) => {
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const markdownContent = editor.storage.markdown.getMarkdown();
      onChange(markdownContent);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: "tight",
        bulletListMarker: "-",
      }),
    ],
    content: value,
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    if (editor && editor.storage.markdown.getMarkdown() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="tiptap-editor" onKeyDown={onKeyDown}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
