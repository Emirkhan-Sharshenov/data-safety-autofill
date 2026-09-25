<#
.SYNOPSIS
  Dead-simple timer for the baseline measurement.

  Messages are ASCII-only: Windows PowerShell 5.1 reads .ps1 as ANSI
  without a UTF-8 BOM, and non-ASCII text would break the parser.

.EXAMPLE
  powershell -File tools/timer.ps1 -Start
  powershell -File tools/timer.ps1 -Stop
#>
[CmdletBinding()]
param(
    [switch]$Start,
    [switch]$Stop,
    [string]$Label = 'baseline'
)

$ErrorActionPreference = 'Stop'
$stateFile = Join-Path $PSScriptRoot ".timer-$Label"

if ($Start) {
    $now = Get-Date
    Set-Content -Path $stateFile -Value $now.Ticks -Encoding ascii -NoNewline
    Write-Host ""
    Write-Host ("  Started at {0:HH:mm:ss}" -f $now) -ForegroundColor Green
    Write-Host "  Run the same command with -Stop when you are done."
    Write-Host ""
    exit
}

if ($Stop) {
    if (-not (Test-Path $stateFile)) {
        Write-Host ""
        Write-Host "  No timer running. Start one with -Start first." -ForegroundColor Yellow
        Write-Host ""
        exit
    }
    $startTime = [datetime]::new([int64](Get-Content $stateFile -Raw).Trim())
    $now = Get-Date
    $span = $now - $startTime
    Remove-Item $stateFile -Force

    Write-Host ""
    Write-Host ("  Started  {0:HH:mm:ss}" -f $startTime)
    Write-Host ("  Stopped  {0:HH:mm:ss}" -f $now)
    Write-Host ("  Elapsed  {0} min {1} sec" -f [int]$span.TotalMinutes, $span.Seconds) -ForegroundColor Green
    Write-Host ""
    Write-Host ("  Write this into eval\baseline.md: {0} min" -f [math]::Round($span.TotalMinutes, 1))
    Write-Host ""
    exit
}

if (Test-Path $stateFile) {
    $startTime = [datetime]::new([int64](Get-Content $stateFile -Raw).Trim())
    $span = (Get-Date) - $startTime
    Write-Host ("  Running for {0} min" -f [int]$span.TotalMinutes)
} else {
    Write-Host "  Nothing running. Use -Start or -Stop."
}
