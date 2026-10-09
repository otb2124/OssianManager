param (
    [switch]$CleanOld
)

# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------
$RootPath = (Get-Item -Path ".").FullName

# Directory names skipped anywhere in the tree
$ExcludedDirNames = @(
    'node_modules', 'dist', '.git', '.angular', '.vscode', '.idea',
    'coverage', 'exports', 'target', '.nx', 'out-tsc'
)

# Relative paths (forward slashes) skipped entirely
$ExcludedRelPaths = @(
    'src-tauri/gen',      # generated schemas / mobile projects
    'src-tauri/target',   # Rust build output
    'src-tauri/icons'     # binary icon assets
)

# File extensions whose content is exported
$IncludedExtensions = @(
    '.ts', '.html', '.scss', '.css', '.less', '.json', '.md', '.svg', '.js', '.mjs',
    '.rs', '.toml'
)

# Files skipped by name
$ExcludedFilePatterns = @(
    'package-lock\.json$', 'yarn\.lock$', 'pnpm-lock\.yaml$', 'Cargo\.lock$',
    '\.spec\.ts$', '\.min\.js$'
)

$MaxFileSizeBytes = 1MB

# ---------------------------------------------------------------
# 1. Determine project name (package.json -> tauri.conf.json -> folder name)
# ---------------------------------------------------------------
$ProjectName = (Get-Item -Path ".").Name

if (Test-Path "package.json") {
    try {
        $PackageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        if ($PackageJson.name) { $ProjectName = $PackageJson.name }
    } catch { }
} elseif (Test-Path "src-tauri/tauri.conf.json") {
    try {
        $TauriConf = Get-Content "src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
        if ($TauriConf.productName) { $ProjectName = $TauriConf.productName }
    } catch { }
}

$CleanProjectName = $ProjectName -replace '[\\/:*?"<>|]', '-'

# ---------------------------------------------------------------
# 2. Exports folder + filename
# ---------------------------------------------------------------
$ExportsFolder = Join-Path -Path $RootPath -ChildPath "exports"
if (-not (Test-Path $ExportsFolder)) {
    New-Item -ItemType Directory -Path $ExportsFolder | Out-Null
}

if ($CleanOld) {
    Write-Host "Cleaning up previous export files in $ExportsFolder..." -ForegroundColor Yellow
    Get-ChildItem -Path $ExportsFolder -Filter "*.xml" | Remove-Item -Force
}

$Timestamp      = Get-Date -Format "yyyyMMdd-HHmmss"
$OutputFileName = "$CleanProjectName-codebase-$Timestamp.xml"
$OutputFilePath = Join-Path -Path $ExportsFolder -ChildPath $OutputFileName

Write-Host "Exporting Angular + Tauri codebase to $OutputFilePath..." -ForegroundColor Green

# ---------------------------------------------------------------
# 3. Pruned walker (does not descend into excluded folders)
# ---------------------------------------------------------------
function Get-RelativePath([string]$FullName) {
    return $FullName.Substring($RootPath.Length + 1).Replace('\', '/')
}

function Test-ExcludedDir($Dir) {
    if ($ExcludedDirNames -contains $Dir.Name) { return $true }
    $rel = Get-RelativePath $Dir.FullName
    foreach ($p in $ExcludedRelPaths) {
        if ($rel -eq $p -or $rel.StartsWith("$p/")) { return $true }
    }
    return $false
}

function Get-ProjectEntries([string]$Path) {
    foreach ($item in Get-ChildItem -LiteralPath $Path -Force) {
        if ($item.PSIsContainer) {
            if (Test-ExcludedDir $item) { continue }
            $item
            Get-ProjectEntries $item.FullName
        } else {
            $item
        }
    }
}

Write-Host "Scanning project..." -ForegroundColor Gray
$AllEntries = @(Get-ProjectEntries $RootPath)

$StringBuilder = [System.Text.StringBuilder]::new()

# ---------------------------------------------------------------
# 4. Header
# ---------------------------------------------------------------
[void]$StringBuilder.AppendLine("<codebase_context>")
[void]$StringBuilder.AppendLine("<overview>")
[void]$StringBuilder.AppendLine("This document contains the source code, directory structure, and configuration files for a desktop application built with an Angular frontend (PrimeNG, Tailwind CSS) and a Tauri (Rust) backend.")
[void]$StringBuilder.AppendLine("The Angular app lives in the project root (src/), and the Tauri/Rust side lives in src-tauri/.")
[void]$StringBuilder.AppendLine("Use this context to analyze, refactor, debug, or generate code matching the project patterns, including Tauri commands, capabilities, and frontend-to-backend IPC.")
[void]$StringBuilder.AppendLine("</overview>")
[void]$StringBuilder.AppendLine()

# ---------------------------------------------------------------
# 5. Directory tree
# ---------------------------------------------------------------
[void]$StringBuilder.AppendLine("<directory_structure>")
foreach ($entry in $AllEntries) {
    $rel = Get-RelativePath $entry.FullName
    if ($entry.PSIsContainer) { $rel += "/" }
    [void]$StringBuilder.AppendLine($rel)
}
[void]$StringBuilder.AppendLine("</directory_structure>")
[void]$StringBuilder.AppendLine()

# ---------------------------------------------------------------
# 6. File contents
# ---------------------------------------------------------------
[void]$StringBuilder.AppendLine("<files>")

$FileCount = 0
foreach ($file in $AllEntries) {
    if ($file.PSIsContainer) { continue }
    if ($IncludedExtensions -notcontains $file.Extension.ToLower()) { continue }

    $skip = $false
    foreach ($pattern in $ExcludedFilePatterns) {
        if ($file.Name -match $pattern) { $skip = $true; break }
    }
    if ($skip) { continue }

    $relativePath = Get-RelativePath $file.FullName

    if ($file.Length -gt $MaxFileSizeBytes) {
        Write-Host "Skipping (too large): $relativePath" -ForegroundColor DarkYellow
        continue
    }

    Write-Host "Processing: $relativePath" -ForegroundColor Gray

    [void]$StringBuilder.AppendLine("  <file path=""$relativePath"">")
    $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8

    if ($content) {
        $safeContent = $content.Replace("</file>", "<\_file>")
        [void]$StringBuilder.AppendLine($safeContent)
    }

    [void]$StringBuilder.AppendLine("  </file>")
    [void]$StringBuilder.AppendLine()
    $FileCount++
}

[void]$StringBuilder.AppendLine("</files>")
[void]$StringBuilder.AppendLine("</codebase_context>")

# ---------------------------------------------------------------
# 7. Save (UTF-8 without BOM)
# ---------------------------------------------------------------
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($OutputFilePath, $StringBuilder.ToString(), $Utf8NoBom)

Write-Host "Export completed: $FileCount files. Saved to $OutputFilePath" -ForegroundColor Green