import re
from pathlib import Path
from playwright.sync_api import expect
from browser_support import browser, static_site, ROOT

REPO = Path(__file__).resolve().parents[1]

def test_demo_tasks_and_lesson():
    with static_site(REPO / 'dist') as url, browser() as b:
        page = b.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url)
        expect(page.get_by_text('Welcome back, Alex 👋', exact=True)).to_be_visible()
        page.get_by_text('Tasks', exact=True).last.click()
        page.get_by_role('button', name='+ New Task', exact=True).click()
        page.get_by_placeholder('e.g. Complete CSS Flexbox exercise').fill('Browser regression task')
        page.get_by_role('button', name='Create Task', exact=True).click()
        expect(page.get_by_text('Browser regression task', exact=True).last).to_be_visible()
        page.get_by_text('Browser regression task', exact=True).last.click()
        page.get_by_placeholder('e.g. Complete CSS Flexbox exercise').fill('Browser task edited')
        page.get_by_role('button', name='Update Task', exact=True).click()
        expect(page.get_by_text('Browser task edited', exact=True).last).to_be_visible()
        page.goto(url + '/lesson/unknown-lesson')
        expect(page.get_by_text('Lesson unavailable. Go back and choose another lesson.', exact=True)).to_be_visible()
        page.screenshot(path=str(ROOT / 'logs' / 'skillforge-error-mobile.png'))
        assert not errors, errors
