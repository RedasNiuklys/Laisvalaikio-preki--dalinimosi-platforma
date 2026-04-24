param(
    [string]$EnvironmentName = "Laisvalaikis-Bakis-env",
    [string]$Configuration = "Release",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Ensure-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

Write-Host "Starting Elastic Beanstalk deployment..." -ForegroundColor Cyan

Ensure-Command dotnet
Ensure-Command eb

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$publishDir = Join-Path $scriptDir "publish"
$bundleDir = Join-Path $scriptDir ".ebbundle"
$artifactPath = Join-Path $scriptDir "deploy.zip"

if (-not $SkipBuild) {
    Write-Host "Publishing server ($Configuration)..." -ForegroundColor Yellow
    dotnet publish -c $Configuration -o $publishDir
}

if (-not (Test-Path $publishDir)) {
    throw "Publish directory not found: $publishDir"
}

Write-Host "Preparing deployment bundle..." -ForegroundColor Yellow
if (Test-Path $bundleDir) {
    Remove-Item $bundleDir -Recurse -Force
}
New-Item -ItemType Directory -Path $bundleDir | Out-Null

robocopy $publishDir $bundleDir /E /XD publish | Out-Null

$procfile = Join-Path $scriptDir "Procfile"
if (Test-Path $procfile) {
    Copy-Item $procfile (Join-Path $bundleDir "Procfile") -Force
}

if (Test-Path $artifactPath) {
    Remove-Item $artifactPath -Force
}

tar.exe -a -c -f $artifactPath -C $bundleDir .

if (-not (Test-Path $artifactPath)) {
    throw "Failed to create deployment artifact: $artifactPath"
}

Write-Host "Deploying with EB CLI..." -ForegroundColor Yellow
if ([string]::IsNullOrWhiteSpace($EnvironmentName)) {
    eb deploy
} else {
    eb deploy $EnvironmentName
}

Write-Host "Deployment command completed." -ForegroundColor Green