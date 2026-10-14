export interface LibraryDependency {
    id: string;
    /** Required version range, shown as-is (no semver resolution yet). */
    version: string;
    optional?: boolean;
  }
  
  export interface LibraryEntry {
    id: string;
    name: string;
    publisher: string;
    version: string;
    summary: string;
    /** Long description, rendered as plain text with line breaks. */
    description: string;
    icon: string;          // primeicons class
    color: string;         // icon tile color
    tags: string[];
    downloads: number;
    rating: number;        // 0..5
    license?: string;
    repository?: string;
    updatedAt: string;     // ISO date
    dependencies: LibraryDependency[];
  }
  
  export interface ResolvedDependency {
    dependency: LibraryDependency;
    /** null when the dependency is not in the catalog. */
    library: LibraryEntry | null;
    installed: boolean;
  }