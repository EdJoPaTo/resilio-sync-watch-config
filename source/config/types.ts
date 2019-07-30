type Dictionary<T> = {[key: string]: T}

export type OwnConfigFolders = Dictionary<string>

export interface OwnConfig {
  basedir: string;
  folders: OwnConfigFolders;
  passthrough?: any;
}

export interface OwnConfigPart {
  basedir?: string;
  folders?: OwnConfigFolders;
  passthrough?: any;
}
