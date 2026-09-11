"""Create fresh local secrets without printing them; never overwrite an existing .env."""
from pathlib import Path
import secrets

repo = Path(__file__).resolve().parents[1] / '.upstream/waoowaoo'
target = repo / '.env'
if target.exists():
    raise SystemExit('Existing .env retained; review manually.')
app = 'ghcr.io/waooai/waoowaoo@sha256:3275844dc8b670d0271d4b6b519ef9812a6d97658408eefbb570cb4c241228dd'
values = {k: secrets.token_hex(32) for k in ['MYSQL_PASSWORD', 'MYSQL_ROOT_PASSWORD', 'REDIS_PASSWORD', 'TEMPORAL_MYSQL_PASSWORD', 'MINIO_ROOT_PASSWORD', 'MINIO_APP_SECRET_KEY', 'NEXTAUTH_SECRET', 'CRON_SECRET', 'API_ENCRYPTION_KEY']}
values.update(APP_IMAGE=app, TEMPORAL_WORKER_BLUE_IMAGE=app, TEMPORAL_WORKER_GREEN_IMAGE=app,
    CODEX_RUNTIME_IMAGE='ghcr.io/waooai/waoowaoo-codex-runtime@sha256:227e693df52733c6ade9a086fcae6c0ae3e603260349d6adb480e59e5f672219',
    TEMPORAL_WORKER_BLUE_BUILD_ID='research-007-6cbbe22-blue', TEMPORAL_WORKER_GREEN_BUILD_ID='research-007-6cbbe22-green',
    CODEX_RUNTIME_HOST_ROOT='/home/yun68/.local/share/codex-video-demos/wao-runtime',
    DATABASE_URL=f"mysql://waoowaoo:{values['MYSQL_PASSWORD']}@127.0.0.1:13306/waoowaoo",
    COMPOSE_DATABASE_URL=f"mysql://waoowaoo:{values['MYSQL_PASSWORD']}@mysql:3306/waoowaoo")
lines = repo.joinpath('.env.example').read_text(encoding='utf-8').splitlines()
target.write_text('\n'.join(f'{line.split("=",1)[0]}={values[line.split("=",1)[0]]}' if '=' in line and line.split('=',1)[0] in values else line for line in lines)+'\n', encoding='utf-8')
print('Created local .env; no secrets displayed.')
