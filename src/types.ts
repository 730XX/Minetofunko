export type ViewMode = '2d' | '3d' | 'split';

export interface SkinMetadata {
  name: string;
  sourceType: 'username' | 'upload' | 'default';
  dataUrl: string;
  isSlim?: boolean;
}
