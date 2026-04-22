export interface GitCommit {
    hash: string;
    hashShort: string;
    message: string;
    author: string;
    date: Date;
    branch: string;
  }
  
export interface RawGitCommit {
    hash: string;
    hashShort: string;
    message: string;
    author: string;
    date: string;
    branch: string;
  }