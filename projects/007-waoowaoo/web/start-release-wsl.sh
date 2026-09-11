#!/bin/sh
set -eu
cd /mnt/f/codex_project/0912_codex_project/projects/007-waoowaoo/.upstream/waoowaoo
install -d -o 1000 -g 1000 /home/yun68/.local/share/codex-video-demos/wao-runtime
docker compose config --quiet
docker compose pull --quiet
docker pull ghcr.io/waooai/waoowaoo-codex-runtime@sha256:227e693df52733c6ade9a086fcae6c0ae3e603260349d6adb480e59e5f672219
sh scripts/temporal/worker-rollout.sh bootstrap blue
docker compose up -d
sh scripts/temporal/worker-rollout.sh status
