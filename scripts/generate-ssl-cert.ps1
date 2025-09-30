# PowerShell script to generate self-signed SSL certificates for Windows
# Usage: .\scripts\generate-ssl-cert.ps1

$ErrorActionPreference = "Stop"

$CertDir = ".\certs"
$CertKey = "$CertDir\localhost-key.pem"
$CertFile = "$CertDir\localhost.pem"
$PfxFile = "$CertDir\localhost.pfx"

# Create certificates directory if it doesn't exist
if (-not (Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir | Out-Null
}

Write-Host "🔐 Generating self-signed SSL certificate for local development..." -ForegroundColor Cyan

# Create a self-signed certificate
$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "*.localhost", "finops.local", "*.finops.local", "127.0.0.1" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(1) `
    -FriendlyName "FinOps Platform Local Development" `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment, DataEncipherment `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1,1.3.6.1.5.5.7.3.2")

# Export certificate to PEM format
$certPath = "Cert:\CurrentUser\My\$($cert.Thumbprint)"
$securePassword = ConvertTo-SecureString -String "finops-dev" -Force -AsPlainText

# Export to PFX first
Export-PfxCertificate -Cert $certPath -FilePath $PfxFile -Password $securePassword | Out-Null

# Convert PFX to PEM using OpenSSL (if available)
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    # Export certificate
    openssl pkcs12 -in $PfxFile -out $CertFile -nodes -clcerts -nokeys -passin pass:finops-dev
    # Export private key
    openssl pkcs12 -in $PfxFile -out $CertKey -nodes -nocerts -passin pass:finops-dev

    Write-Host "✅ SSL certificate generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Certificate files:" -ForegroundColor Yellow
    Write-Host "  Key:  $CertKey"
    Write-Host "  Cert: $CertFile"
    Write-Host "  PFX:  $PfxFile"
} else {
    Write-Host "✅ Certificate created but OpenSSL not found." -ForegroundColor Yellow
    Write-Host "PFX file created at: $PfxFile" -ForegroundColor Yellow
    Write-Host "To convert to PEM format, install OpenSSL and run:" -ForegroundColor Yellow
    Write-Host "  openssl pkcs12 -in $PfxFile -out $CertFile -nodes -clcerts -nokeys -passin pass:finops-dev"
    Write-Host "  openssl pkcs12 -in $PfxFile -out $CertKey -nodes -nocerts -passin pass:finops-dev"
}

Write-Host ""
Write-Host "To trust this certificate on Windows:" -ForegroundColor Cyan
Write-Host "  1. The certificate has been added to your personal store"
Write-Host "  2. To add to trusted root (requires admin):"
Write-Host "     Import-Certificate -FilePath '$CertFile' -CertStoreLocation Cert:\LocalMachine\Root"
Write-Host ""
Write-Host "Certificate thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
Write-Host ""
Write-Host "Remember to add to .gitignore:" -ForegroundColor Yellow
Write-Host "  certs/"