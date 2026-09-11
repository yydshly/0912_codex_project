#!/bin/sh
# Official Docker CE packages for the existing Ubuntu 22.04 WSL distribution.
# Reference: https://docs.docker.com/engine/install/ubuntu/
set -eu
if command -v docker >/dev/null 2>&1; then
  docker version
  exit 0
fi
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: jammy
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl start docker
docker version
docker compose version
