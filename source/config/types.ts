export type OwnConfigFolders = Readonly<Record<string, string>>

export interface OwnConfig {
  readonly basedir: string;
  readonly folders: OwnConfigFolders;
  readonly passthrough?: Readonly<Record<string, Readonly<unknown>>>;
}
