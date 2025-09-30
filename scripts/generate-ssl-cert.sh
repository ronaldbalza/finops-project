#!/bin/bash

# Script to generate self-signed SSL certificates for local development
# Usage: ./scripts/generate-ssl-cert.sh

set -e

CERT_DIR="./certs"
CERT_KEY="$CERT_DIR/localhost-key.pem"
CERT_FILE="$CERT_DIR/localhost.pem"
CONFIG_FILE="$CERT_DIR/localhost.conf"

# Create certificates directory if it doesn't exist
mkdir -p $CERT_DIR

# Create OpenSSL configuration file
cat > $CONFIG_FILE << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = US
ST = State
L = City
O = FinOps Platform Development
OU = Development
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = finops.local
DNS.4 = *.finops.local
DNS.5 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

echo "🔐 Generating self-signed SSL certificate for local development..."

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $CERT_KEY \
  -out $CERT_FILE \
  -config $CONFIG_FILE

echo "✅ SSL certificate generated successfully!"
echo ""
echo "Certificate files:"
echo "  Key:  $CERT_KEY"
echo "  Cert: $CERT_FILE"
echo ""
echo "To trust this certificate on your system:"
echo ""
echo "🍎 macOS:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_FILE"
echo ""
echo "🐧 Linux:"
echo "  sudo cp $CERT_FILE /usr/local/share/ca-certificates/localhost.crt"
echo "  sudo update-ca-certificates"
echo ""
echo "🪟 Windows (PowerShell as Admin):"
echo "  Import-Certificate -FilePath \"$CERT_FILE\" -CertStoreLocation Cert:\\LocalMachine\\Root"
echo ""
echo "Add to .gitignore:"
echo "  certs/"