#!/bin/bash
# Verification script for Grafana and Prometheus setup

set -e

echo "=========================================="
echo "Monitoring Stack Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if required files exist
echo "1. Checking configuration files..."
files=(
    "prometheus/prometheus.yml"
    "prometheus/alerts/alerting-rules.yml"
    "grafana/provisioning/datasources/prometheus.yml"
    "grafana/provisioning/dashboards/dashboards.yml"
    "grafana/provisioning/dashboards/json/system-overview.json"
    "grafana/provisioning/dashboards/json/job-processing.json"
    "grafana/provisioning/dashboards/json/resource-utilization.json"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo -e "\n${RED}Error: Some configuration files are missing${NC}"
    exit 1
fi

echo -e "\n${GREEN}All configuration files present${NC}\n"

# Validate Prometheus configuration
echo "2. Validating Prometheus configuration..."
if command -v docker &> /dev/null; then
    docker run --rm -v "$(pwd)/prometheus:/etc/prometheus" --entrypoint promtool prom/prometheus:v2.48.0 \
        check config /etc/prometheus/prometheus.yml
    
    echo -e "\n3. Validating alert rules..."
    docker run --rm -v "$(pwd)/prometheus:/etc/prometheus" --entrypoint promtool prom/prometheus:v2.48.0 \
        check rules /etc/prometheus/alerts/alerting-rules.yml
    
    echo -e "\n${GREEN}Prometheus configuration is valid${NC}\n"
else
    echo -e "${YELLOW}Docker not found, skipping validation${NC}\n"
fi

# Validate JSON dashboards
echo "4. Validating Grafana dashboard JSON..."
for dashboard in grafana/provisioning/dashboards/json/*.json; do
    if command -v jq &> /dev/null; then
        if jq empty "$dashboard" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $(basename $dashboard)"
        else
            echo -e "${RED}✗${NC} $(basename $dashboard) (invalid JSON)"
            exit 1
        fi
    else
        echo -e "${YELLOW}jq not found, skipping JSON validation${NC}"
        break
    fi
done

echo -e "\n${GREEN}All dashboard JSON files are valid${NC}\n"

# Check docker-compose configuration
echo "5. Checking docker-compose configuration..."
cd ..
if docker compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} docker-compose.yml is valid"
else
    echo -e "${RED}✗${NC} docker-compose.yml has errors"
    exit 1
fi

if docker compose -f docker-compose.yml -f docker-compose.prod.yml config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} docker-compose.prod.yml is valid"
else
    echo -e "${RED}✗${NC} docker-compose.prod.yml has errors"
    exit 1
fi

echo -e "\n${GREEN}Docker Compose configuration is valid${NC}\n"

# Summary
echo "=========================================="
echo -e "${GREEN}Verification Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the monitoring stack:"
echo "   docker compose up -d prometheus grafana"
echo ""
echo "2. Access the dashboards:"
echo "   - Grafana: http://localhost:3002"
echo "   - Prometheus: http://localhost:9090"
echo ""
echo "3. Verify metrics are being collected:"
echo "   curl http://localhost:3001/metrics"
echo ""
echo "4. Check Prometheus targets:"
echo "   curl http://localhost:9090/api/v1/targets"
echo ""
