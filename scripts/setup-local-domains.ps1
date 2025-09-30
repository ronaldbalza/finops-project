# PowerShell script to set up local domain entries for Windows
# Usage: Run as Administrator: .\scripts\setup-local-domains.ps1

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

$ErrorActionPreference = "Stop"

$HostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
$BackupFile = "$HostsFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "🔧 Setting up local domains for FinOps Platform development..." -ForegroundColor Cyan
Write-Host ""

# Create a backup of the hosts file
Copy-Item -Path $HostsFile -Destination $BackupFile -Force
Write-Host "📋 Backup created: $BackupFile" -ForegroundColor Green
Write-Host ""

# Define the local domains
$LocalDomains = @(
    "finops.local"
    "app.finops.local"
    "api.finops.local"
    "admin.finops.local"
    "demo.finops.local"
    "tenant1.finops.local"
    "tenant2.finops.local"
    "tenant3.finops.local"
    "test.finops.local"
    "staging.finops.local"
)

# Read current hosts file
$HostsContent = Get-Content $HostsFile -Raw

# Remove existing FinOps entries if any
$Pattern = "# FinOps Platform Local Development[\s\S]*?# End FinOps Platform\r?\n"
$HostsContent = $HostsContent -replace $Pattern, ""

# Add new entries
$NewEntries = @"

# FinOps Platform Local Development
# Added on $(Get-Date)
"@

foreach ($domain in $LocalDomains) {
    $NewEntries += "`n127.0.0.1       $domain"
    $NewEntries += "`n::1             $domain"
    Write-Host "✅ Adding: $domain" -ForegroundColor Green
}

$NewEntries += "`n# End FinOps Platform`n"

# Write back to hosts file
$HostsContent += $NewEntries
[System.IO.File]::WriteAllText($HostsFile, $HostsContent)

Write-Host ""
Write-Host "✨ Local domains configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now access:" -ForegroundColor Cyan

foreach ($domain in $LocalDomains) {
    Write-Host "  https://${domain}:5173 (Frontend)" -ForegroundColor White
    Write-Host "  https://${domain}:8787 (API)" -ForegroundColor White
}

Write-Host ""
Write-Host "To remove these entries, run as Administrator:" -ForegroundColor Yellow
Write-Host '  (Get-Content "$env:SystemRoot\System32\drivers\etc\hosts") -notmatch "finops.local" | Set-Content "$env:SystemRoot\System32\drivers\etc\hosts"'
Write-Host ""
Write-Host "To restore from backup:" -ForegroundColor Yellow
Write-Host "  Copy-Item -Path '$BackupFile' -Destination '$HostsFile' -Force"
Write-Host ""

# Flush DNS cache
Write-Host "Flushing DNS cache..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Null
Write-Host "✅ DNS cache flushed" -ForegroundColor Green