import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useCallback, useState } from "react";
import { Mention } from '@tiptap/extension-mention';
import suggestion from './suggestion';
import { useContextItems } from './use-context-items';

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  files: { title: string; content: string }[];
  tags: string[];
  folders: string[];
  currentFileName: string;
  currentFileContent: string;
}

interface MentionNodeAttrs {
  id: string;
  label: string;
  title: string;
  content: string;
  type: 'file' | 'tag' | 'folder';
  path?: string;
}

const Tiptap: React.FC<TiptapProps> = ({ 
  value, 
  onChange, 
  onKeyDown, 
  files, 
  tags,
  folders,
  currentFileName, 
  currentFileContent 
}) => {
  const { addItem } = useContextItems();

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
          items: ({ query, editor }) => suggestion.items({ query, editor }),
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

            if (props.type === 'file') {
              addItem({
                id: props.path || props.title,
                type: 'file',
                title: props.title,
                content: props.content,
                reference: `@${props.title}`
              });
            } else if (props.type === 'tag') {
              addItem({
                id: props.title,
                type: 'tag',
                title: props.title,
                content: `Tag: ${props.title}`,
                reference: `#${props.title}`
              });
            } else if (props.type === 'folder') {
              addItem({
                id: props.path || props.title,
                type: 'folder',
                title: props.title,
                content: `Folder: ${props.path || props.title}`,
                reference: `/${props.title}`
              });
            }
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
          { title: currentFileName, content: currentFileContent, path: currentFileName },
          ...files.map(file => ({ ...file, path: file.title }))
        ],
        tags,
        folders: folders.map(folder => ({ title: folder, path: folder })),
      };
    }
  }, [editor, files, tags, folders, currentFileName, currentFileContent]);

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