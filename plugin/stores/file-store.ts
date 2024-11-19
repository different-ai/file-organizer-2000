import { create } from 'zustand'
import { TFile } from 'obsidian'

interface FileState {
  activeFile: TFile | null
  noteContent: string
  isMediaFile: boolean
  isInIgnoredPatterns: boolean
  setActiveFile: (file: TFile | null) => void
  setNoteContent: (content: string) => void
  setIsMediaFile: (isMedia: boolean) => void
  setIsInIgnoredPatterns: (isIgnored: boolean) => void
  clearState: () => void
}

export const useFileStore = create<FileState>((set) => ({
  activeFile: null,
  noteContent: '',
  isMediaFile: false,
  isInIgnoredPatterns: false,
  setActiveFile: (file) => set({ activeFile: file }),
  setNoteContent: (content) => set({ noteContent: content }),
  setIsMediaFile: (isMedia) => set({ isMediaFile: isMedia }),
  setIsInIgnoredPatterns: (isIgnored) => set({ isInIgnoredPatterns: isIgnored }),
  clearState: () => set({ 
    activeFile: null, 
    noteContent: '', 
    isMediaFile: false,
    isInIgnoredPatterns: false 
  })
})) 