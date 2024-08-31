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
  tags: string[];
  folders: string[];
  onFileSelect: (selectedFiles: { title: string; content: string; reference: string; path: string }[]) => void;
  onTagSelect: (selectedTags: string[]) => void;
  onFolderSelect: (selectedFolders: string[]) => void;
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
  onFileSelect, 
  onTagSelect,
  onFolderSelect,
  currentFileName, 
  currentFileContent 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{ title: string; content: string; reference: string; path: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

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
              console.log(props, "props");

            if (props.type === 'file') {
              const newSelectedFile = {
                title: props.title,
                content: props.content,
                reference: `@${props.title}`,
                path: props.path || props.title
              };
              const newSelectedFiles = selectedFiles.some(file => file.title === props.title) 
                ? selectedFiles 
                : [...selectedFiles, newSelectedFile];
              setSelectedFiles(newSelectedFiles);
              onFileSelect(newSelectedFiles);
            } else if (props.type === 'tag') {
              console.log(props.title, "props.title");
              const newSelectedTags = selectedTags.includes(props.title)
                ? selectedTags
                : [...selectedTags, props.title];
              setSelectedTags(newSelectedTags);
              onTagSelect(newSelectedTags);
            } else if (props.type === 'folder') {
              console.log(props.title, "props.title");
              const newSelectedFolders = selectedFolders.includes(props.path || props.title)
                ? selectedFolders
                : [...selectedFolders, props.path || props.title];
              setSelectedFolders(newSelectedFolders);
              onFolderSelect(newSelectedFolders);
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