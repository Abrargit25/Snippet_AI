export type SnippetListItem = {
  id: string;
  title: string;
  language: string;
  languageFull: string;
  codeContent: string;
  tags: string[];
  timeAgo: string;
  createdAt: string;
  isFavorited: boolean;
  aiExplanation?: string;
  imageUri?: string;
};

export type SnippetFormData = {
  id?: string;
  title?: string;
  language?: string;
  codeContent?: string;
  tags?: string[];
  isFavorited?: boolean;
  imageUri?: string;
};

export type ExportFormat = 'txt' | 'js' | 'json';
