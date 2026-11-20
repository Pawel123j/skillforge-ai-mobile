"""Real PostgreSQL policies; a disposable DB, not a hosted Supabase integration.

The admin URL must point at an isolated development/CI PostgreSQL instance.
Only the UUID-named database created here is dropped. Auth functions reproduce
the JWT claim contract; authentication, PostgREST and hosted settings are separate.
"""
import os
from pathlib import Path
from uuid import uuid4

import psycopg
import pytest
from psycopg import sql
from psycopg.conninfo import make_conninfo

ROOT = Path(__file__).resolve().parents[1]
A, B = str(uuid4()), str(uuid4())
OWNED = ['profiles', 'tasks', 'projects', 'quiz_results', 'user_progress']
CONTENT = ['learning_paths', 'modules', 'lessons', 'quiz_questions']


@pytest.fixture(scope='module')
def database():
    admin_url = os.environ.get('SKILLFORGE_TEST_ADMIN_URL')
    if not admin_url:
        pytest.skip('SKILLFORGE_TEST_ADMIN_URL is required (isolated PostgreSQL)')
    name = 'skillforge_test_' + uuid4().hex
    with psycopg.connect(admin_url, autocommit=True) as admin:
        for role in ['anon', 'authenticated']:
            if not admin.execute('SELECT 1 FROM pg_roles WHERE rolname=%s', (role,)).fetchone():
                admin.execute(sql.SQL('CREATE ROLE {} NOLOGIN').format(sql.Identifier(role)))
        admin.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(name)))
        url = make_conninfo(admin_url, dbname=name)
        try:
            with psycopg.connect(url) as db:
                db.execute('''
                    CREATE SCHEMA auth;
                    CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}');
                    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
                      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
                    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
                      $$ SELECT current_setting('request.jwt.claim.role', true) $$;
                    GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
                ''')
                db.execute((ROOT / 'schema.sql').read_text())
                for migration in sorted((ROOT / 'migrations').glob('*.sql')):
                    db.execute(migration.read_text())
                db.execute((ROOT / 'seed.sql').read_text())
                db.execute('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated')
                db.execute('INSERT INTO auth.users(id, raw_user_meta_data) VALUES (%s,%s),(%s,%s)',
                           (A, '{"full_name":"Alice"}', B, '{"full_name":"Bob"}'))
                module = db.execute('SELECT id FROM modules LIMIT 1').fetchone()[0]
                for user in [A, B]:
                    db.execute('INSERT INTO tasks(user_id,title) VALUES (%s, %s)', (user, 'private task'))
                    db.execute('INSERT INTO projects(user_id,title) VALUES (%s, %s)', (user, 'private project'))
                    db.execute('INSERT INTO quiz_results(user_id,module_id,score,total_questions,passed) VALUES (%s,%s,1,1,true)', (user, module))
            yield url
        finally:
            admin.execute(sql.SQL('DROP DATABASE {}').format(sql.Identifier(name)))


@pytest.fixture
def db(database):
    with psycopg.connect(database) as connection:
        yield connection
        connection.rollback()


def identity(db, user=A, role='authenticated'):
    db.execute(sql.SQL('SET LOCAL ROLE {}').format(sql.Identifier(role)))
    db.execute("SELECT set_config('request.jwt.claim.sub', %s, true)", (user or '',))
    db.execute("SELECT set_config('request.jwt.claim.role', %s, true)", (role,))


@pytest.mark.parametrize('table', OWNED)
def test_only_owner_can_read(db, table):
    identity(db)
    assert db.execute(sql.SQL('SELECT user_id::text FROM {}').format(sql.Identifier(table))).fetchall() == [(A,)]


@pytest.mark.parametrize('table', OWNED + CONTENT)
def test_anonymous_cannot_read(db, table):
    identity(db, None, 'anon')
    assert db.execute(sql.SQL('SELECT * FROM {}').format(sql.Identifier(table))).fetchall() == []


@pytest.mark.parametrize('table', ['tasks', 'projects'])
def test_owner_crud_and_no_cross_user_write(db, table):
    identity(db)
    ident = sql.Identifier(table)
    row = db.execute(sql.SQL('INSERT INTO {}(user_id,title) VALUES (%s,%s) RETURNING id').format(ident), (A, 'mine')).fetchone()[0]
    assert db.execute(sql.SQL('UPDATE {} SET title=%s WHERE id=%s').format(ident), ('edited', row)).rowcount == 1
    assert db.execute(sql.SQL('UPDATE {} SET title=%s WHERE user_id=%s').format(ident), ('stolen', B)).rowcount == 0
    assert db.execute(sql.SQL('DELETE FROM {} WHERE user_id=%s').format(ident), (B,)).rowcount == 0
    with pytest.raises(psycopg.errors.InsufficientPrivilege), db.transaction():
        db.execute(sql.SQL('INSERT INTO {}(user_id,title) VALUES (%s,%s)').format(ident), (B, 'forged'))
    with pytest.raises(psycopg.errors.InsufficientPrivilege), db.transaction():
        db.execute(sql.SQL('UPDATE {} SET user_id=%s WHERE id=%s').format(ident), (B, row))
    assert db.execute(sql.SQL('DELETE FROM {} WHERE id=%s').format(ident), (row,)).rowcount == 1


@pytest.mark.parametrize('table,column,value', [('profiles','full_name','Changed'), ('user_progress','xp',25)])
def test_owner_update_cannot_transfer_ownership(db, table, column, value):
    identity(db)
    ident = sql.Identifier(table)
    assert db.execute(sql.SQL('UPDATE {} SET {}=%s WHERE user_id=%s').format(ident,sql.Identifier(column)), (value,A)).rowcount == 1
    assert db.execute(sql.SQL('UPDATE {} SET {}=%s WHERE user_id=%s').format(ident,sql.Identifier(column)), (value,B)).rowcount == 0
    with pytest.raises(psycopg.errors.InsufficientPrivilege), db.transaction():
        db.execute(sql.SQL('UPDATE {} SET user_id=%s WHERE user_id=%s').format(ident), (str(uuid4()),A))


@pytest.mark.parametrize('table', CONTENT)
def test_authenticated_content_is_read_only(db, table):
    identity(db)
    ident = sql.Identifier(table)
    assert db.execute(sql.SQL('SELECT count(*) FROM {}').format(ident)).fetchone()[0] > 0
    assert db.execute(sql.SQL('DELETE FROM {}').format(ident)).rowcount == 0
    assert db.execute(sql.SQL('UPDATE {} SET id=id').format(ident)).rowcount == 0


def test_signup_trigger_initializes_each_user_once(db):
    assert db.execute('SELECT full_name FROM profiles WHERE user_id=%s', (A,)).fetchone() == ('Alice',)
    assert db.execute('SELECT xp FROM user_progress WHERE user_id=%s', (A,)).fetchone() == (0,)
    config = db.execute("SELECT proconfig FROM pg_proc WHERE oid='public.handle_new_user()'::regprocedure").fetchone()[0]
    assert config and 'search_path=""' in config


def test_seed_is_repeatable_without_duplicate_questions(db):
    before = db.execute('SELECT count(*) FROM quiz_questions').fetchone()[0]
    db.execute((ROOT / 'seed.sql').read_text())
    assert db.execute('SELECT count(*) FROM quiz_questions').fetchone()[0] == before


def test_forged_quiz_result_is_denied(db):
    identity(db)
    module = db.execute('SELECT id FROM modules LIMIT 1').fetchone()[0]
    with pytest.raises(psycopg.errors.InsufficientPrivilege), db.transaction():
        db.execute('INSERT INTO quiz_results(user_id,module_id,score,total_questions,passed) VALUES (%s,%s,1,1,true)', (B,module))
    assert db.execute('UPDATE quiz_results SET score=0').rowcount == 0
    assert db.execute('DELETE FROM quiz_results').rowcount == 0
