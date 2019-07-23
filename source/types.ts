export type ResilioConfig = any

type Dictionary<T> = {[key: string]: T}

export interface OwnConfig {
  basedir: string;
  folders: Dictionary<string>;
  passthrough?: any;
}

export interface OwnConfigPart {
  basedir?: string;
  folders?: Dictionary<string>;
  passthrough?: any;
}
