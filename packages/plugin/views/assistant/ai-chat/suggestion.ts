import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import MentionList from './mentions'
import Fuse from 'fuse.js'

const suggestion = {
  items: ({ query, editor }: { query: string; editor: any }) => {
    const allFiles = editor.storage.mention.files || []
    const allTags = editor.storage.mention.tags || []
    const allFolders = editor.storage.mention.folders || []
    
    if (query.length === 0) {
      return [
        ...allFiles.slice(0, 5),
        ...allTags.slice(0, 3),
        ...allFolders.slice(0, 2)
      ]
    }

    const fuse = new Fuse([
      ...allFiles,
      ...allTags.slice(0, 3),
      ...allFolders
    ], {
      keys: ['title'],
      threshold: 0.3,
    })

    return fuse.search(query).slice(0, 10).map(result => result.item)
  },

  render: () => {
    let reactRenderer: ReactRenderer
    let popup: any[]

    return {
      onStart: (props: any) => {
        if (!props.clientRect) {
          return
        }

        reactRenderer = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: reactRenderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props: any) {
        reactRenderer.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        return reactRenderer.ref?.onKeyDown(props)
      },

      onExit() {
        popup[0].destroy()
        reactRenderer.destroy()
      },

      command: (props: any, item: any) => {
        return props.command({ 
          ...item,
          type: item.type,
          id: item.id || item.title,
          label: item.label || item.title,
          path: item.path
        })
      },
    }
  },
}

export default suggestion