export type OwnConfigFolders = Record<string, string>

export interface OwnConfig {
  basedir: string;
  folders: OwnConfigFolders;
  passthrough?: any;
}
