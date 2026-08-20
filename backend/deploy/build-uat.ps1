<#
.SYNOPSIS
    Builds the Cadence SPA + .NET API into a single self-hosting publish folder for MonsterASP.NET.

.DESCRIPTION
    1. Builds the React SPA (production mode → same-origin /api calls).
    2. Copies the built SPA into the API's wwwroot, so the API serves it.
    3. Publishes the API (framework-dependent, net10.0) to .\publish.

    The resulting .\publish folder is what you upload via WebDeploy or FTP.
    See README-UAT.md for the MonsterASP control-panel steps.

.EXAMPLE
    ./build-uat.ps1
#>
[CmdletBinding()]
param(
    [string]$Configuration = 'Release'
)

$ErrorActionPreference = 'Stop'

# Run a native exe (npm/dotnet) without letting its stderr warnings abort the script:
# PowerShell turns native stderr into terminating errors under -ErrorAction Stop, but tools
# like Vite and dotnet write informational warnings there. We judge success by exit code.
function Invoke-Native {
    param([Parameter(Mandatory)][string]$Exe, [string[]]$Arguments, [string]$FailMessage)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $Exe @Arguments } finally { $ErrorActionPreference = $prev }
    if ($LASTEXITCODE -ne 0) { throw ($FailMessage + " (exit $LASTEXITCODE)") }
}

$here      = $PSScriptRoot
$repoRoot  = (Resolve-Path (Join-Path $here '..\..')).Path
$appDir    = Join-Path $repoRoot 'app'
$apiDir    = (Resolve-Path (Join-Path $here '..\src\Tspm.Api')).Path
$wwwroot   = Join-Path $apiDir 'wwwroot'
$publishDir = Join-Path $here 'publish'

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# 1. Build the SPA -----------------------------------------------------------
Step '1/3  Building the React SPA (production)'
Push-Location $appDir
try {
    if (-not (Test-Path (Join-Path $appDir 'node_modules'))) {
        Write-Host 'node_modules missing - running npm install first.' -ForegroundColor Yellow
        Invoke-Native -Exe 'npm' -Arguments @('install') -FailMessage 'npm install failed.'
    }
    Invoke-Native -Exe 'npm' -Arguments @('run', 'build') -FailMessage 'SPA build failed.'
} finally {
    Pop-Location
}

# 2. Copy the SPA into wwwroot ----------------------------------------------
Step '2/3  Copying SPA into API wwwroot'
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot | Out-Null
Copy-Item (Join-Path $appDir 'dist\*') $wwwroot -Recurse -Force
Write-Host "Copied to $wwwroot"

# 3. Publish the API ---------------------------------------------------------
Step "3/3  Publishing the API ($Configuration)"
if (Test-Path $publishDir) { Remove-Item $publishDir -Recurse -Force }
Invoke-Native -Exe 'dotnet' -Arguments @('publish', $apiDir, '-c', $Configuration, '-o', $publishDir) -FailMessage 'dotnet publish failed.'

Write-Host "`nDone. Upload the contents of:" -ForegroundColor Green
Write-Host "  $publishDir"
Write-Host "to your MonsterASP site root (wwwroot) via WebDeploy or FTP."
Write-Host "Then set the connection string + JWT key on the server - see README-UAT.md."
