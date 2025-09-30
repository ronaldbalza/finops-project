#!/bin/bash

# Script to set up local domain entries for multi-tenant subdomain testing
# Usage: sudo ./scripts/setup-local-domains.sh

set -e

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run with sudo: sudo $0"
    exit 1
fi

HOSTS_FILE="/etc/hosts"
BACKUP_FILE="/etc/hosts.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Setting up local domains for FinOps Platform development..."
echo ""

# Create a backup of the hosts file
cp $HOSTS_FILE $BACKUP_FILE
echo "📋 Backup created: $BACKUP_FILE"
echo ""

# Define the local domains
LOCAL_DOMAINS=(
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

# Remove existing FinOps entries
sed -i.tmp '/# FinOps Platform Local Development/,/# End FinOps Platform/d' $HOSTS_FILE

# Add new entries
echo "" >> $HOSTS_FILE
echo "# FinOps Platform Local Development" >> $HOSTS_FILE
echo "# Added on $(date)" >> $HOSTS_FILE

for domain in "${LOCAL_DOMAINS[@]}"; do
    echo "127.0.0.1       $domain" >> $HOSTS_FILE
    echo "::1             $domain" >> $HOSTS_FILE
    echo "✅ Added: $domain"
done

echo "# End FinOps Platform" >> $HOSTS_FILE
echo "" >> $HOSTS_FILE

echo ""
echo "✨ Local domains configured successfully!"
echo ""
echo "You can now access:"
for domain in "${LOCAL_DOMAINS[@]}"; do
    echo "  https://$domain:5173 (Frontend)"
    echo "  https://$domain:8787 (API)"
done
echo ""
echo "To remove these entries, run:"
echo "  sudo sed -i '/# FinOps Platform Local Development/,/# End FinOps Platform/d' $HOSTS_FILE"
echo ""
echo "To restore from backup:"
echo "  sudo cp $BACKUP_FILE $HOSTS_FILE"