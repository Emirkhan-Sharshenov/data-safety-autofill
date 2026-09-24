<#
.SYNOPSIS
  Сохраняет скриншот Bob task session summary из буфера обмена в bob_sessions/
  с именем по формату хакатона.

.EXAMPLE
  # 1. В Bob IDE: Tasks -> задача -> клик по заголовку -> Win+Shift+S (выделить панель)
  # 2.
  powershell -File tools/new-session-shot.ps1 -Task 1 -Desc login_flow

.EXAMPLE
  # Взять последний файл из Pictures\Screenshots вместо буфера обмена
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

# Имя команды: параметр -> tools/.team -> запрос один раз
$teamFile = Join-Path $PSScriptRoot '.team'
if (-not $Team) {
    if (Test-Path $teamFile) {
        $Team = (Get-Content $teamFile -Raw).Trim()
    } else {
        throw "Укажи команду один раз: -Team <name>. Значение запомнится в tools\.team"
    }
} else {
    Set-Content -Path $teamFile -Value $Team -Encoding utf8 -NoNewline
}

# Нормализация: только [a-z0-9_]
$slug = ($Desc.ToLowerInvariant() -replace '[^a-z0-9]+', '_').Trim('_')
$teamSlug = ($Team.ToLowerInvariant() -replace '[^a-z0-9]+', '')
$name = '{0}_task{1:d2}_{2}_summary.png' -f $teamSlug, $Task, $slug
$dest = Join-Path $outDir $name

if (Test-Path $dest) {
    $stamp = Get-Date -Format 'HHmmss'
    $dest = Join-Path $outDir ($name -replace '\.png$', "_$stamp.png")
    Write-Warning "Файл с таким именем уже есть, сохраняю как $(Split-Path $dest -Leaf)"
}

if ($FromScreenshotsFolder) {
    $shots = Join-Path ([Environment]::GetFolderPath('MyPictures')) 'Screenshots'
    if (-not (Test-Path $shots)) { throw "Папка не найдена: $shots" }
    $latest = Get-ChildItem $shots -Filter *.png |
              Sort-Object LastWriteTime -Descending |
              Select-Object -First 1
    if (-not $latest) { throw "В $shots нет PNG-файлов" }
    Copy-Item $latest.FullName $dest
} else {
    $img = [System.Windows.Forms.Clipboard]::GetImage()
    if (-not $img) {
        throw "В буфере обмена нет картинки. Сначала сделай Win+Shift+S, потом запусти скрипт."
    }
    $img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
}

$f = Get-Item $dest
Write-Host ("OK  {0}  ({1:N0} KB)" -f $f.Name, ($f.Length / 1KB)) -ForegroundColor Green
Write-Host ("    {0}" -f $f.FullName) -ForegroundColor DarkGray
Write-Host ""
Write-Host "Всего скриншотов в bob_sessions: $((Get-ChildItem $outDir -Filter *.png).Count)"
