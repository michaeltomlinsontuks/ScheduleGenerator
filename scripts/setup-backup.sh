#!/bin/bash
# =============================================================================
# Backup Setup Script
# =============================================================================
# Interactive script to configure automated backups
# =============================================================================

set -e

echo "=== UP Schedule Generator - Backup Setup ==="
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    OS="unknown"
fi

echo "Detected OS: $OS"
echo ""

# Check if running in Docker environment
if [ -f /.dockerenv ]; then
    DOCKER_ENV=true
else
    DOCKER_ENV=false
fi

# Function to prompt for input with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local result
    
    read -p "$prompt [$default]: " result
    echo "${result:-$default}"
}

# Function to prompt yes/no
prompt_yes_no() {
    local prompt="$1"
    local default="${2:-n}"
    local result
    
    while true; do
        read -p "$prompt (y/n) [$default]: " result
        result="${result:-$default}"
        case "$result" in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

echo "=== Backup Configuration ==="
echo ""

# Backup schedule
echo "Backup Schedule (cron format):"
echo "  Daily at 2 AM:     0 2 * * *"
echo "  Every 6 hours:     0 */6 * * *"
echo "  Weekly (Sunday):   0 0 * * 0"
BACKUP_SCHEDULE=$(prompt_with_default "Enter backup schedule" "0 2 * * *")

# Retention days
RETENTION_DAYS=$(prompt_with_default "Backup retention (days)" "7")

# Alert configuration
echo ""
echo "=== Alert Configuration ==="
if prompt_yes_no "Configure webhook alerts (Slack, Discord, etc.)?"; then
    WEBHOOK_URL=$(prompt_with_default "Webhook URL" "")
else
    WEBHOOK_URL=""
fi

if prompt_yes_no "Configure email alerts?"; then
    ALERT_EMAIL=$(prompt_with_default "Alert email address" "")
else
    ALERT_EMAIL=""
fi

# Deployment method
echo ""
echo "=== Deployment Method ==="
echo "1. Docker Compose (recommended)"
echo "2. Systemd Timer (Linux only)"
echo "3. Cron (traditional)"
read -p "Select deployment method [1]: " DEPLOY_METHOD
DEPLOY_METHOD="${DEPLOY_METHOD:-1}"

# Update .env file
echo ""
echo "=== Updating Configuration ==="

if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "Backed up existing .env file"
fi

# Add or update backup configuration in .env
{
    echo ""
    echo "# Backup Configuration"
    echo "BACKUP_SCHEDULE=$BACKUP_SCHEDULE"
    echo "BACKUP_RETENTION_DAYS=$RETENTION_DAYS"
    [ -n "$WEBHOOK_URL" ] && echo "BACKUP_ALERT_WEBHOOK_URL=$WEBHOOK_URL"
    [ -n "$ALERT_EMAIL" ] && echo "BACKUP_ALERT_EMAIL=$ALERT_EMAIL"
} >> .env

echo "Updated .env file with backup configuration"

# Create backups directory
mkdir -p backups
echo "Created backups directory"

# Deploy based on selected method
echo ""
echo "=== Deploying Backup Service ==="

case $DEPLOY_METHOD in
    1)
        echo "Deploying with Docker Compose..."
        if command -v docker &> /dev/null; then
            docker compose -f docker-compose.yml -f docker-compose.backup.yml up -d backup
            echo "✓ Backup service started"
            echo ""
            echo "View logs: docker logs -f schedgen-backup"
            echo "Manual backup: docker exec schedgen-backup /usr/local/bin/backup-all.sh"
        else
            echo "ERROR: Docker not found. Please install Docker first."
            exit 1
        fi
        ;;
    2)
        if [ "$OS" != "linux" ]; then
            echo "ERROR: Systemd is only available on Linux"
            exit 1
        fi
        echo "Installing systemd timer..."
        sudo cp scripts/backup.service /etc/systemd/system/
        sudo cp scripts/backup.timer /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable backup.timer
        sudo systemctl start backup.timer
        echo "✓ Systemd timer installed and started"
        echo ""
        echo "Check status: sudo systemctl status backup.timer"
        echo "View logs: sudo journalctl -u backup.service -f"
        echo "Manual backup: sudo systemctl start backup.service"
        ;;
    3)
        echo "Installing cron job..."
        # Update cron file with actual path
        INSTALL_DIR=$(pwd)
        sed "s|/opt/schedgen|$INSTALL_DIR|g" scripts/backup-cron > /tmp/schedgen-backup-cron
        sudo cp /tmp/schedgen-backup-cron /etc/cron.d/schedgen-backup
        sudo chmod 644 /etc/cron.d/schedgen-backup
        sudo systemctl restart cron 2>/dev/null || sudo service cron restart 2>/dev/null
        echo "✓ Cron job installed"
        echo ""
        echo "View logs: tail -f /var/log/schedgen-backup.log"
        echo "Manual backup: $INSTALL_DIR/scripts/backup-all.sh"
        ;;
    *)
        echo "Invalid selection"
        exit 1
        ;;
esac

# Test backup
echo ""
if prompt_yes_no "Run a test backup now?"; then
    echo "Running test backup..."
    case $DEPLOY_METHOD in
        1)
            docker exec schedgen-backup /usr/local/bin/backup-all.sh
            ;;
        2|3)
            ./scripts/backup-all.sh
            ;;
    esac
    echo ""
    echo "Backup files:"
    ls -lh backups/
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Backup schedule: $BACKUP_SCHEDULE"
echo "Retention: $RETENTION_DAYS days"
echo "Backup directory: $(pwd)/backups"
echo ""
echo "For more information, see: docs/production/BACKUP_AUTOMATION.md"
