"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useCallback } from "react";
import { Mention } from '@tiptap/extension-mention';
import suggestion from './suggestion';

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  files: { title: string; content: string }[];
  onFileSelect: (selectedFiles: { title: string; content: string }[]) => void;
}

const Tiptap: React.FC<TiptapProps> = ({ value, onChange, onKeyDown, files, onFileSelect }) => {
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const content = editor.getText();
      onChange(content);

      const selectedFiles = editor.storage.mention.selectedFiles || [];
      console.log(selectedFiles, "selectedFiles", 'inside tip tap editor');
      onFileSelect(selectedFiles);
    },
    [onChange, onFileSelect]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          ...suggestion,
          items: ({ query }) => suggestion.items({ query, editor }),
        },
      }),
    ],
    content: value,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.storage.mention = {
        files,
        selectedFiles: [],
      };
    }
  }, [editor, files]);

  useEffect(() => {
    if (editor && editor.getText() !== value) {
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