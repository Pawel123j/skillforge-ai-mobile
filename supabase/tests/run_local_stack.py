"""Run real Auth/PostgREST against a private disposable PostgreSQL instance."""
import base64
import hashlib
import hmac
import http.server
import json
import os
from pathlib import Path
import secrets
import socket
import sys
import signal
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[2]
RUN = 'sf-stage3-' + uuid.uuid4().hex[:10]
DOCKER = ['docker', '--host=unix:///var/run/docker.sock']
ENV = dict(os.environ)
for name in ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']:
    ENV.pop(name, None)
PASSWORD, JWT_SECRET = secrets.token_hex(24), secrets.token_hex(32)
PRIVATE = Path(tempfile.mkdtemp(prefix=RUN + '-', dir='/tmp'))
containers = []
network_created = False
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # loopback only

def docker(*args, input=None, check=True):
    p = subprocess.run(DOCKER + list(args), env=ENV, input=input, capture_output=True, text=True)
    if check and p.returncode:
        message = p.stderr.replace(PASSWORD, '<redacted>').replace(JWT_SECRET, '<redacted>')
        raise RuntimeError(message)
    return p

def envfile(name, values):
    p = PRIVATE / name
    fd = os.open(p, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'w') as f:
        for key, value in values.items(): f.write(f'{key}={value}\n')
    return str(p)

def port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0)); return s.getsockname()[1]

def wait_http(url):
    last_error = None
    for _ in range(120):
        try:
            with opener.open(url, timeout=1) as response:
                if response.status == 200: return
        except (OSError, urllib.error.HTTPError) as error: last_error = error
        time.sleep(.25)
    raise RuntimeError(f'service not ready: {url}: {last_error}')

def run_container(suffix, image, values, bindings=(), extra=()):
    name = RUN + '-' + suffix
    arguments = ['run', '-d', '--name', name, '--network', RUN, '--network-alias', suffix,
                 '--label', 'codex.stage3.owner=' + RUN, '--env-file', envfile(suffix + '.env', values)]
    for binding in bindings: arguments += ['-p', binding]
    arguments += list(extra) + [image]
    docker(*arguments);containers.append(name)
    return name

def jwt(role):
    encode = lambda value: base64.urlsafe_b64encode(json.dumps(value, separators=(',', ':')).encode()).rstrip(b'=')
    signed = encode({'alg':'HS256','typ':'JWT'}) + b'.' + encode({'role':role,'iss':'supabase','iat':int(time.time()),'exp':int(time.time())+3600})
    return (signed+b'.'+base64.urlsafe_b64encode(hmac.new(JWT_SECRET.encode(),signed,hashlib.sha256).digest()).rstrip(b'=')).decode()

AUTH_PORT, REST_PORT, DB_PORT = port(), port(), port()
ANON = jwt('anon')
class Gateway(http.server.BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def handle_request(self):
        if self.headers.get('apikey') != ANON:
            self.send_error(403);return
        if self.path.startswith('/auth/v1/'):
            target = f'http://127.0.0.1:{AUTH_PORT}' + self.path[len('/auth/v1'):]
        elif self.path.startswith('/rest/v1/'):
            target = f'http://127.0.0.1:{REST_PORT}' + self.path[len('/rest/v1'):]
        else:
            self.send_error(404);return
        body = self.rfile.read(int(self.headers.get('Content-Length','0'))) or None
        headers = {k:v for k,v in self.headers.items() if k.lower() not in ['host','connection','content-length']}
        request = urllib.request.Request(target, data=body, headers=headers, method=self.command)
        try: response = opener.open(request, timeout=20)
        except urllib.error.HTTPError as error: response = error
        with response:
            data = response.read();self.send_response(response.status)
            for key, value in response.headers.items():
                if key.lower() not in ['transfer-encoding','connection','content-length','server','date']:
                    self.send_header(key, value)
            self.send_header('Content-Length', str(len(data)));self.end_headers();self.wfile.write(data)
    do_GET = do_POST = do_PATCH = do_DELETE = handle_request

def terminate(_signal, _frame):
    raise SystemExit(128 + _signal)
signal.signal(signal.SIGTERM, terminate)

server = http.server.ThreadingHTTPServer(('127.0.0.1',0), Gateway)
url = f'http://127.0.0.1:{server.server_port}'
thread = threading.Thread(target=server.serve_forever, daemon=True)
exit_code = 1
try:
    docker('network','create','--label','codex.stage3.owner='+RUN,RUN);network_created=True
    db = run_container('db','postgres:16-alpine',{'POSTGRES_PASSWORD':PASSWORD},
                       [f'127.0.0.1:{DB_PORT}:5432'], ['--tmpfs','/var/lib/postgresql/data:rw,size=256m'])
    for _ in range(120):
        if docker('exec',db,'pg_isready','-h','127.0.0.1','-U','postgres',check=False).returncode == 0:break
        time.sleep(.25)
    else: raise RuntimeError('PostgreSQL not ready')
    bootstrap = f"""
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD '{PASSWORD}';
GRANT anon, authenticated, service_role TO authenticator;
CREATE ROLE supabase_auth_admin LOGIN NOINHERIT PASSWORD '{PASSWORD}';
CREATE SCHEMA auth AUTHORIZATION supabase_auth_admin;
ALTER ROLE supabase_auth_admin SET search_path TO auth, public;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
"""
    docker('exec','-i',db,'psql','-U','postgres','-v','ON_ERROR_STOP=1',input=bootstrap)
    auth = run_container('auth','supabase/gotrue:v2.197.0', {
        'GOTRUE_API_HOST':'0.0.0.0','GOTRUE_API_PORT':'9999', 'API_EXTERNAL_URL':url,
        'GOTRUE_DB_DRIVER':'postgres', 'GOTRUE_DB_DATABASE_URL':f'postgres://supabase_auth_admin:{PASSWORD}@db:5432/postgres',
        'GOTRUE_SITE_URL':url,'GOTRUE_DISABLE_SIGNUP':'false','GOTRUE_JWT_ADMIN_ROLES':'service_role',
        'GOTRUE_JWT_AUD':'authenticated','GOTRUE_JWT_DEFAULT_GROUP_NAME':'authenticated',
        'GOTRUE_JWT_EXP':'3600','GOTRUE_JWT_SECRET':JWT_SECRET,
        'GOTRUE_EXTERNAL_EMAIL_ENABLED':'true','GOTRUE_MAILER_AUTOCONFIRM':'true',
        'GOTRUE_RATE_LIMIT_EMAIL_SENT':'100','GOTRUE_RATE_LIMIT_TOKEN_REFRESH':'100',
    }, [f'127.0.0.1:{AUTH_PORT}:9999'])
    wait_http(f'http://127.0.0.1:{AUTH_PORT}/health')
    sql = """
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
   nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
 SELECT coalesce(nullif(current_setting('request.jwt.claim.role',true),''),
   nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role')
$$;
""" + (ROOT/'supabase/schema.sql').read_text()
    for migration in sorted((ROOT/'supabase/migrations').glob('*.sql')): sql += '\n'+migration.read_text()
    sql += '\n'+(ROOT/'supabase/seed.sql').read_text()
    sql += '\nGRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;\n'
    docker('exec','-i',db,'psql','-U','postgres','-v','ON_ERROR_STOP=1',input=sql)
    rest = run_container('rest','postgrest/postgrest:v14.18',{
        'PGRST_DB_URI':f'postgres://authenticator:{PASSWORD}@db:5432/postgres',
        'PGRST_DB_SCHEMAS':'public','PGRST_DB_ANON_ROLE':'anon','PGRST_JWT_SECRET':JWT_SECRET,
    },[f'127.0.0.1:{REST_PORT}:3000'])
    wait_http(f'http://127.0.0.1:{REST_PORT}/')
    thread.start()
    test_env={**os.environ,'SKILLFORGE_TEST_SUPABASE_URL':url,'SKILLFORGE_TEST_ANON_KEY':ANON}
    print('Disposable stack ready: PostgreSQL 16, Auth 2.197.0, PostgREST 14.18',flush=True)
    result=subprocess.run(['node','--test','supabase/tests/http.test.mjs'],cwd=ROOT,env=test_env)
    exit_code=result.returncode
    if exit_code == 0:
        sql_env = {**os.environ, 'SKILLFORGE_TEST_ADMIN_URL': f'postgresql://postgres:{PASSWORD}@127.0.0.1:{DB_PORT}/postgres'}
        exit_code = subprocess.run([sys.executable, '-m', 'pytest', '-q', 'supabase/tests/test_rls.py'], cwd=ROOT, env=sql_env).returncode
except Exception:
    for name in containers:
        diagnostic = docker('logs', '--tail', '45', name, check=False)
        output = (diagnostic.stdout + diagnostic.stderr).replace(PASSWORD, '<redacted>').replace(JWT_SECRET, '<redacted>')
        print('Diagnostic for owned service:', name, output, flush=True)
    raise
finally:
    if thread.is_alive():server.shutdown();thread.join()
    server.server_close()
    for name in reversed(containers):
        docker('rm','-f',name,check=False)
    if network_created:docker('network','rm',RUN,check=False)
    for p in PRIVATE.iterdir():p.unlink()
    PRIVATE.rmdir()
    print('Removed only owned stack:',RUN,flush=True)
raise SystemExit(exit_code)
