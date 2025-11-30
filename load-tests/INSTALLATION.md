# K6 Installation Guide

## Overview

K6 is a modern load testing tool built for developers. This guide covers installation on macOS, Linux, and Windows.

## macOS Installation

### Using Homebrew (Recommended)

```bash
brew install k6
```

### Verify Installation

```bash
k6 version
```

Expected output:
```
k6 v0.47.0 (2023-11-29T12:21:00+0000/v0.47.0-0-gd8c9e0c, go1.21.4, darwin/arm64)
```

## Linux Installation

### Debian/Ubuntu

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Fedora/CentOS

```bash
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

### Using Snap

```bash
sudo snap install k6
```

## Windows Installation

### Using Chocolatey

```powershell
choco install k6
```

### Using Scoop

```powershell
scoop install k6
```

### Manual Installation

1. Download the latest release from https://github.com/grafana/k6/releases
2. Extract the archive
3. Add the k6 binary to your PATH

## Docker Installation (Alternative)

If you prefer not to install K6 locally, you can run it via Docker:

```bash
# Run a test
docker run --rm -i --network=host grafana/k6 run - < baseline.js

# Run with volume mount for results
docker run --rm -i --network=host \
  -v $(pwd):/scripts \
  grafana/k6 run /scripts/baseline.js
```

## Verify Installation

After installation, verify K6 is working:

```bash
# Check version
k6 version

# Run a simple test
k6 run --vus 1 --duration 10s - <<EOF
import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('http://localhost:3001/health');
  sleep(1);
}
EOF
```

## Troubleshooting

### Command Not Found

**Problem:** `k6: command not found`

**Solution:**
- Ensure K6 is installed: `which k6`
- Check your PATH: `echo $PATH`
- Restart your terminal after installation

### Permission Denied

**Problem:** Permission errors when running K6

**Solution:**
```bash
# Make test scripts executable
chmod +x *.sh

# Or run with bash explicitly
bash run-all-tests.sh
```

### Network Issues

**Problem:** Cannot connect to services

**Solution:**
```bash
# Verify services are running
docker compose ps

# Check service health
curl http://localhost:3001/health
curl http://localhost:3000

# Restart services if needed
docker compose restart
```

## Next Steps

After installation:

1. Read [QUICK_START.md](./QUICK_START.md) for running tests
2. Read [README.md](./README.md) for detailed test documentation
3. Start with the baseline test: `k6 run baseline.js`

## Additional Resources

- [K6 Official Documentation](https://k6.io/docs/)
- [K6 GitHub Repository](https://github.com/grafana/k6)
- [K6 Community Forum](https://community.k6.io/)
