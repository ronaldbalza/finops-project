# Development Scripts

This directory contains utility scripts for setting up and managing the FinOps Platform development environment.

## Available Scripts

### 🔐 SSL Certificate Generation

Generate self-signed SSL certificates for local HTTPS development.

#### macOS/Linux
```bash
./scripts/generate-ssl-cert.sh
```

#### Windows (PowerShell)
```powershell
.\scripts\generate-ssl-cert.ps1
```

This will create:
- `certs/localhost.pem` - Certificate file
- `certs/localhost-key.pem` - Private key file

### 🌐 Local Domain Setup

Configure local domains for multi-tenant subdomain testing.

#### macOS/Linux
```bash
sudo ./scripts/setup-local-domains.sh
```

#### Windows (PowerShell as Administrator)
```powershell
.\scripts\setup-local-domains.ps1
```

This will add the following domains to your hosts file:
- `finops.local`
- `app.finops.local`
- `api.finops.local`
- `admin.finops.local`
- `demo.finops.local`
- `tenant1.finops.local`
- `tenant2.finops.local`
- `tenant3.finops.local`
- `test.finops.local`
- `staging.finops.local`

## Usage

After running both scripts, you can:

1. Access the application with HTTPS:
   - Frontend: https://finops.local:5173
   - API: https://finops.local:8787

2. Test multi-tenant subdomains:
   - https://tenant1.finops.local:5173
   - https://tenant2.finops.local:5173

## Troubleshooting

### Certificate Trust Issues

If your browser shows certificate warnings:

**macOS:**
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/localhost.pem
```

**Windows:**
```powershell
Import-Certificate -FilePath "certs\localhost.pem" -CertStoreLocation Cert:\LocalMachine\Root
```

**Linux:**
```bash
sudo cp certs/localhost.pem /usr/local/share/ca-certificates/localhost.crt
sudo update-ca-certificates
```

### DNS Issues

If domains don't resolve:

1. Flush DNS cache:
   - macOS: `sudo dscacheutil -flushcache`
   - Windows: `ipconfig /flushdns`
   - Linux: `sudo systemd-resolve --flush-caches`

2. Verify hosts file entries:
   - macOS/Linux: `cat /etc/hosts | grep finops`
   - Windows: `type C:\Windows\System32\drivers\etc\hosts | findstr finops`

### Removing Configurations

To remove local domains:

**macOS/Linux:**
```bash
sudo sed -i '/# FinOps Platform Local Development/,/# End FinOps Platform/d' /etc/hosts
```

**Windows:**
```powershell
(Get-Content "$env:SystemRoot\System32\drivers\etc\hosts") -notmatch "finops.local" | Set-Content "$env:SystemRoot\System32\drivers\etc\hosts"
```

## Security Note

The generated certificates are for **development only**. Never use self-signed certificates in production environments.