export interface Attachment {
  name?: string;
  contentType?: string;
  url?: string;
}

export interface LocalAttachment {
  id: string;
  name: string;
  contentType: string;
  url: string;
  size: number;
}

export interface AttachmentHandlerProps {
  onAttachmentsChange: (attachments: LocalAttachment[]) => void;
  maxFileSize?: number; // in bytes, defaults to 4MB
  acceptedTypes?: string[]; // e.g. ['image/*', 'application/pdf']
}

export interface AttachmentPreviewProps {
  attachment: LocalAttachment;
  onRemove: (id: string) => void;
} 