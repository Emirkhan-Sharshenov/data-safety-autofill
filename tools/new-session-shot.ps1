<#
.SYNOPSIS
  Saves a Bob task session summary screenshot into bob_sessions/ using the
  naming format required by the IBM Bob 2.0 hackathon.

  NOTE: messages are ASCII-only on purpose. Windows PowerShell 5.1 reads .ps1
  files as ANSI unless they carry a UTF-8 BOM, so non-ASCII text here would
  break the parser depending on how the script is launched.

.EXAMPLE
  # 1. Bob IDE: Tasks -> pick task -> click task header -> Win+Shift+S
  # 2.
  powershell -File tools/new-session-shot.ps1 -Team myteam -Task 1 -Desc login_flow

.EXAMPLE
  # Use the newest file in Pictures\Screenshots instead of the clipboard
  powershell -File tools/new-session-shot.ps1 -Task 2 -Desc repo_analysis -FromScreenshotsFolder
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][int]$Task,
    [Parameter(Mandatory = $true)][string]$Desc,
    [string]$Team,
    [switch]$FromScreenshotsFolder
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $repoRoot 'bob_sessions'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Team name: -Team parameter, else remembered value in tools\.team
$teamFile = Join-Path $PSScriptRoot '.team'
if (-not $Team) {
    if (Test-Path $teamFile) {
        $Team = (Get-Content $teamFile -Raw).Trim()
    } else {
        throw "Pass -Team <name> once; it is remembered in tools\.team"
    }
} else {
    Set-Content -Path $teamFile -Value $Team -Encoding utf8 -NoNewline
}

# Normalize to [a-z0-9_]
$slug = ($Desc.ToLowerInvariant() -replace '[^a-z0-9]+', '_').Trim('_')
$teamSlug = ($Team.ToLowerInvariant() -replace '[^a-z0-9]+', '')
if (-not $slug) { throw "-Desc must contain at least one letter or digit" }
if (-not $teamSlug) { throw "-Team must contain at least one letter or digit" }

$name = '{0}_task{1:d2}_{2}_summary.png' -f $teamSlug, $Task, $slug
$dest = Join-Path $outDir $name

if (Test-Path $dest) {
    $stamp = Get-Date -Format 'HHmmss'
    $dest = Join-Path $outDir ($name -replace '\.png$', "_$stamp.png")
    Write-Warning "Name already taken, saving as $(Split-Path $dest -Leaf)"
}

function Get-ClipboardImage {
    # powershell -File may run outside STA, where Clipboard access silently
    # returns nothing. Try the WinForms API on a dedicated STA thread, then
    # fall back to the built-in cmdlet.
    $result = $null
    try {
        $ps = [powershell]::Create()
        $ps.Runspace = [runspacefactory]::CreateRunspace()
        $ps.Runspace.ApartmentState = 'STA'
        $ps.Runspace.Open()
        $null = $ps.AddScript({
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.Clipboard]::GetImage()
        })
        $result = $ps.Invoke() | Select-Object -First 1
        $ps.Runspace.Close(); $ps.Dispose()
    } catch { }
    if ($result) { return $result }

    try { $result = Get-Clipboard -Format Image -ErrorAction Stop } catch { }
    return $result
}

function Get-LatestScreenshot {
    $dirs = @(
        (Join-Path ([Environment]::GetFolderPath('MyPictures')) 'Screenshots'),
        (Join-Path ([Environment]::GetFolderPath('MyPictures')) 'Снимки экрана'),
        [Environment]::GetFolderPath('Desktop')
    )
    $candidates = foreach ($d in $dirs) {
        if (Test-Path $d) { Get-ChildItem $d -Filter *.png -ErrorAction SilentlyContinue }
    }
    $candidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

$saved = $false

if (-not $FromScreenshotsFolder) {
    $img = Get-ClipboardImage
    if ($img) {
        $img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        $saved = $true
    }
}

if (-not $saved) {
    $latest = Get-LatestScreenshot
    if (-not $latest) {
        throw "No image in clipboard and no recent PNG found. Use Win+PrtScn (saves straight to Pictures\Screenshots), then run this again."
    }
    $age = [int]((Get-Date) - $latest.LastWriteTime).TotalMinutes
    if (-not $FromScreenshotsFolder -and $age -gt 10) {
        throw "Clipboard empty, and the newest screenshot is $age minutes old. Take a fresh one, or pass -FromScreenshotsFolder to use it anyway."
    }
    Copy-Item $latest.FullName $dest
    Write-Host ("  using file: {0} ({1} min old)" -f $latest.Name, $age) -ForegroundColor DarkGray
}

$f = Get-Item $dest
Write-Host ("OK  {0}  ({1:N0} KB)" -f $f.Name, ($f.Length / 1KB)) -ForegroundColor Green
Write-Host ("    {0}" -f $f.FullName) -ForegroundColor DarkGray
Write-Host ""
$count = (Get-ChildItem $outDir -Filter *.png).Count
Write-Host "Screenshots in bob_sessions: $count"
