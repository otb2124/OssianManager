<#
.SYNOPSIS
  Builds OssianManager (Angular + Tauri) and assembles an output folder for the
  chosen configuration. The OssianForge engine is NOT built here: an already
  built engine folder (e.g. from Visual Studio) is copied as-is.

    <OUT_DIR>/<release|debug>/
      ossian-manager.exe
      .ossian/                 (copied from the clean template)
      <ENGINE_FOLDER_NAME>/    (copy of ENGINE_DIST; contains the engine exe)

  Release: no dev console, no webview devtools.
  Debug:   webview devtools + terminal console (debug_assertions in Rust).

  Settings come from .env (next to this script). Command-line parameters
  override .env, and .env overrides the built-in defaults.

  ENGINE_DIST may contain {config}, which is replaced with Debug or Release,
  e.g. ENGINE_DIST=C:\path\OssianForge\bin\{config}\net8.0

.EXAMPLE
  .\build.ps1 -Configuration Release
  .\build.ps1 -Configuration Debug -SkipEngine
  .\build.ps1 -Configuration Debug -EngineDist C:\path\OssianForge\bin\Debug\net8.0
#>
[CmdletBinding()]
param(
    [ValidateSet('Release', 'Debug')]
    [string] $Configuration = 'Release',

    [string] $EngineDist,
    [string] $OutDir,
    [string] $EngineFolderName,
    [string] $EngineExeName,
    [string] $EnvFile,
    [switch] $SkipManager,
    [switch] $SkipEngine
)

$ErrorActionPreference = 'Stop'
# $PSScriptRoot can be empty in some PowerShell hosts, so fall back to the invocation path
$repoRoot = $PSScriptRoot
if (-not $repoRoot) { $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $EnvFile)  { $EnvFile  = Join-Path $repoRoot '.env' }

# --- .env loader -------------------------------------------------------------
function Import-DotEnv([string] $Path) {
    $vars = @{}
    if (-not (Test-Path $Path)) { return $vars }
    foreach ($line in Get-Content $Path) {
        $l = $line.Trim()
        if ($l -eq '' -or $l.StartsWith('#')) { continue }
        $i = $l.IndexOf('=')
        if ($i -lt 1) { continue }
        $k = $l.Substring(0, $i).Trim()
        $v = $l.Substring($i + 1).Trim()
        if ($v.Length -ge 2 -and (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'")))) {
            $v = $v.Substring(1, $v.Length - 2)
        }
        $vars[$k] = $v
    }
    return $vars
}

$envVars = Import-DotEnv $EnvFile

# precedence: parameter > .env > default
function Pick([string] $Param, [string] $Key, [string] $Default) {
    if ($Param) { return $Param }
    if ($envVars.ContainsKey($Key) -and $envVars[$Key] -ne '') { return $envVars[$Key] }
    return $Default
}

$EngineDist       = Pick $EngineDist       'ENGINE_DIST'         ''
$OutDir           = Pick $OutDir           'OUT_DIR'             'artifacts'
$EngineFolderName = Pick $EngineFolderName 'ENGINE_FOLDER_NAME'  'OssianForge'
$EngineExeName    = Pick $EngineExeName    'ENGINE_EXE_NAME'     'OssianForge.exe'
$keepUserTags     = (Pick '' 'KEEP_USER_TAGS' 'true').ToLower() -eq 'true'
$ossianTemplate   = Pick '' 'OSSIAN_TEMPLATE' 'release-template\.ossian'

# relative paths in .env resolve against the script folder
if (-not [IO.Path]::IsPathRooted($OutDir))         { $OutDir         = Join-Path $repoRoot $OutDir }
if (-not [IO.Path]::IsPathRooted($ossianTemplate)) { $ossianTemplate = Join-Path $repoRoot $ossianTemplate }

# {config} in ENGINE_DIST becomes Debug/Release, so one .env line works for both builds
if ($EngineDist) { $EngineDist = $EngineDist.Replace('{config}', $Configuration) }
if ($EngineDist -and -not [IO.Path]::IsPathRooted($EngineDist)) {
    $EngineDist = Join-Path $repoRoot $EngineDist
}
if (-not $SkipEngine -and -not $EngineDist) {
    throw "ENGINE_DIST is not set. Put it in .env or pass -EngineDist (or use -SkipEngine)."
}

# Windows PowerShell 5.1's `Set-Content -Encoding UTF8` adds a BOM, which breaks JSON.parse in the app
function Write-Utf8NoBom([string] $Path, [string] $Text) {
    [IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function Invoke-Step([string] $Title, [scriptblock] $Body) {
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
    & $Body
    if ($LASTEXITCODE -ne 0) { throw "Step failed: $Title (exit code $LASTEXITCODE)" }
}

$isDebug   = $Configuration -eq 'Debug'
$cfgFolder = $Configuration.ToLower()               # release | debug
$tauriDir  = Join-Path $repoRoot 'src-tauri'
$outRoot   = Join-Path $OutDir $cfgFolder
$engineOut = Join-Path $outRoot $EngineFolderName

Write-Host "Configuration: $Configuration  ->  $outRoot" -ForegroundColor Yellow

# --- check the engine dist before touching anything ------------------------------
if (-not $SkipEngine) {
    if (-not (Test-Path (Join-Path $EngineDist $EngineExeName))) {
        throw "Engine exe '$EngineExeName' not found in $EngineDist - build the engine in Visual Studio first (check ENGINE_DIST / ENGINE_EXE_NAME)"
    }
}

# --- clean output (this configuration only) ------------------------------------
# a running build (manager or engine) locks its exe and blocks the clean-up -> stop anything running from the output folder
if (Test-Path $outRoot) {
    $running = Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -and $_.Path.StartsWith($outRoot, [StringComparison]::OrdinalIgnoreCase)
    }
    foreach ($proc in $running) {
        Write-Host "Stopping running process: $($proc.ProcessName) (pid $($proc.Id))" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force
    }
    if ($running) { Start-Sleep -Seconds 1 }
    Remove-Item $outRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $outRoot | Out-Null

# --- 1. manager ----------------------------------------------------------------
if (-not $SkipManager) {
    Push-Location $repoRoot
    try {
        Invoke-Step 'npm ci' { npm ci }

        # --no-bundle: raw exe only, skip MSI/NSIS (tauri.conf targets = "all")
        # --debug: Rust debug build -> devtools + terminal console (see lib.rs / main.rs)
        # beforeBuildCommand in tauri.conf.json runs `npm run build:web` (ng build)
        $tauriArgs = @('build', '--no-bundle')
        if ($isDebug) { $tauriArgs += '--debug' }
        Invoke-Step "tauri $($tauriArgs -join ' ')" { npm run tauri -- @tauriArgs }
    }
    finally { Pop-Location }

    $managerExe = Join-Path $tauriDir "target\$cfgFolder\ossian-manager.exe"
    if (-not (Test-Path $managerExe)) { throw "Manager exe not found: $managerExe" }
    Copy-Item $managerExe $outRoot
}

# --- 2. engine (copy the already built dist, no dotnet build/publish) ----------
if (-not $SkipEngine) {
    Write-Host "`n=== engine (copy prebuilt from $EngineDist) ===" -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $engineOut -Force | Out-Null
    Copy-Item (Join-Path $EngineDist '*') $engineOut -Recurse -Force
    if (-not (Test-Path (Join-Path $engineOut $EngineExeName))) {
        throw "Engine exe '$EngineExeName' missing in $engineOut after copy"
    }
}

# --- 3. .ossian (clean template committed in the repo) -------------------------
Write-Host "`n=== .ossian ===" -ForegroundColor Cyan
if (-not (Test-Path $ossianTemplate)) { throw "Template folder not found: $ossianTemplate" }
$dstOssian = Join-Path $outRoot '.ossian'
Copy-Item $ossianTemplate $dstOssian -Recurse

# strip a BOM from any copied JSON (e.g. template files saved by an editor that adds one)
Get-ChildItem $dstOssian -Filter *.json -Recurse | ForEach-Object {
    $text = [IO.File]::ReadAllText($_.FullName)           # ReadAllText drops the BOM
    Write-Utf8NoBom $_.FullName $text
}

# keep engineProjectPath in sync with ENGINE_FOLDER_NAME / ENGINE_EXE_NAME
$appJson = Join-Path $dstOssian 'app.json'
$app = Get-Content $appJson -Raw | ConvertFrom-Json
$app.engineProjectPath = "./$EngineFolderName/$EngineExeName"
Write-Utf8NoBom $appJson ($app | ConvertTo-Json -Depth 20)

if (-not $keepUserTags) {
    Write-Utf8NoBom (Join-Path $dstOssian 'user-tags.json') '[]'
}

Write-Host "`nDone ($Configuration) -> $outRoot" -ForegroundColor Green
Get-ChildItem $outRoot | Format-Table Name, Length -AutoSize