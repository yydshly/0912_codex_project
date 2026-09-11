"""Import real generated assets through the app's authenticated native API.
TLS verifies this installation's exported public CA; host trust is not modified.
Credentials stay in ignored temp/. No provider or assistant response is simulated.
"""
import json
import hashlib
import secrets
import uuid
from pathlib import Path
import requests

project = Path(__file__).resolve().parents[1]
state_file = project / 'temp/demo-state.json'
state = json.loads(state_file.read_text('utf-8')) if state_file.exists() else {
    'identity':'codex-cafe-demo', 'password':secrets.token_urlsafe(24)}
def save():
    state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
save()
session = requests.Session()
session.verify = str(project / 'temp/wao-local-root.crt')
base = 'https://localhost:1443'
session.headers.update({'Origin':base,'Referer':base+'/zh','Accept-Language':'zh-CN'})
def req(method, path, **kwargs):
    response = session.request(method, base+path, timeout=120, **kwargs)
    if not response.ok:
        print('HTTP failure:',response.status_code, path, response.text[:1200])
        response.raise_for_status()
    return response.json()

csrf = req('GET','/api/auth/csrf')['csrfToken']
auth = req('POST','/api/auth/callback/credentials',data={
    'csrfToken':csrf,'identity':state['identity'],'password':state['password'],
    'mode':'login' if state.get('registered') else 'register','json':'true','callbackUrl':base+'/zh'})
user = req('GET','/api/auth/session')
if not user.get('user'):
    raise SystemExit('Authentication did not establish a session; credentials not printed.')
state['registered']=True
save()
if not state.get('projectId'):
    created = req('POST','/api/projects',json={'name':'街角咖啡 · Codex 实际素材演示',
        'description':'Codex 生成图片，Pixelle 合成短片；在 waoowaoo 实际导入并组织素材。未接入应用内生成模型。','videoRatio':'16:9'})
    state['projectId']=created['project']['id']
    save()
pid = state['projectId']
items=[(project/'assets/cafe-exterior.png','01 清晨咖啡店.png'),
       (project/'assets/cafe-interior.png','02 窗边拿铁.png'),
       (project.parent/'006-pixelle-video/assets/cafe-demo.mp4','03 Pixelle 实际合成短片.mp4')]
state.setdefault('imports',{})
for path, name in items:
    if name in state['imports']:
        continue
    mime = 'video/mp4' if path.suffix=='.mp4' else 'image/png'
    with path.open('rb') as file:
        uploaded=req('POST',f'/api/projects/{pid}/upload-media',files={'file':(path.name,file,mime)},data={'name':name})
    token=uploaded['attachment']['attachmentToken']
    result=req('POST',f'/api/projects/{pid}/uploaded-media/materialize',
        headers={'Idempotency-Key':str(uuid.uuid4())},json={'attachmentToken':token,'name':name})
    state['imports'][name]=result
    save()
    print('Imported:',name)
resources=req('GET',f'/api/projects/{pid}/resources')
(project/'temp/resources-verified.json').write_text(json.dumps(resources,ensure_ascii=False,indent=2),encoding='utf-8')
print('Verified project:',pid)
print('Resource count:',len(resources.get('page',{}).get('items',[])))
proof=[]
for item in resources['page']['items']:
    media=session.get(base+item['summary']['url'], timeout=120)
    media.raise_for_status()
    digest=hashlib.sha256(media.content).hexdigest()
    assert digest == item['current']['sha256'], item['name']
    proof.append({'name':item['name'],'mediaType':item['mediaType'],'status':item['status'],
        'version':item['contentVersion'],'bytes':len(media.content),'sha256':digest,'retrievalVerified':True})
(project/'notes/import-verification.json').write_text(json.dumps({'date':'2026-09-11',
    'projectId':pid,'verification':'Authenticated native API; TLS checked with installation public CA',
    'resources':proof},ensure_ascii=False,indent=2),encoding='utf-8')
print('All media retrieved and SHA-256 verified.')
