"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useCallback, useState } from "react";
import { Mention } from '@tiptap/extension-mention';
import suggestion from './suggestion';

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  files: { title: string; content: string }[];
  onFileSelect: (selectedFiles: { title: string; content: string; reference: string }[]) => void;
  currentFileName: string;
  currentFileContent: string;
}

interface MentionNodeAttrs {
  id: string;
  label: string;
  title: string;
  content: string;
}

const Tiptap: React.FC<TiptapProps> = ({ 
  value, 
  onChange, 
  onKeyDown, 
  files, 
  onFileSelect, 
  currentFileName, 
  currentFileContent 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{ title: string; content: string; reference: string }[]>([]);

  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const content = editor.getText();
      onChange(content);
    },
    [onChange]
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
          command: ({ editor, range, props }: { editor: any; range: any; props: MentionNodeAttrs }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: 'mention',
                  attrs: props
                },
                {
                  type: 'text',
                  text: ' '
                },
              ])
              .run()

            const newSelectedFile = {
              title: props.title,
              content: props.content,
              reference: `@${props.title}`
            };
            const newSelectedFiles = selectedFiles.some(file => file.title === props.title) 
              ? selectedFiles 
              : [...selectedFiles, newSelectedFile];
            setSelectedFiles(newSelectedFiles);
            onFileSelect(newSelectedFiles);
          },
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
        files: [
          { title: currentFileName, content: currentFileContent },
          ...files.filter(file => file.title !== currentFileName)
        ],
      };
    }
  }, [editor, files, currentFileName, currentFileContent]);

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