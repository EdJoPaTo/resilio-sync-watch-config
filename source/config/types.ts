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

export interface ResilioConfigFolder {
  dir: string;
  secret: string;
}

export interface ResilioConfig {
  device_name: string;
  storage_path: string;
  shared_folders: ResilioConfigFolder[];
}
