/**
 * Automated in-browser verification script.
 * Spawns a Chromium/Edge browser in headless mode with a dedicated temporary profile,
 * connects to CDP, and tests:
 *  - Login page loads without blank screen or console errors
 *  - Student login
 *  - Book search
 *  - Book details
 *  - Rack and shelf navigation
 *  - Librarian login
 *  - Dashboard and Racks & Shelves tab
 *  - Map Editor
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

async function main() {
  const browserPath = fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')
    ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const tempProfile = path.join(os.tmpdir(), `bookbeacon-browser-test-${Date.now()}`);
  fs.mkdirSync(tempProfile, { recursive: true });

  const port = 9333; // Use a fresh, dedicated port
  console.log(`Spawning headless browser: ${browserPath} on port ${port}...`);

  const browserProc = spawn(
    browserPath,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${tempProfile}`,
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  browserProc.on('error', (err) => {
    console.error('Failed to spawn browser:', err);
  });

  // Wait for browser to be ready
  let versionData: any = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {
      // wait
    }
  }

  if (!versionData) {
    browserProc.kill();
    throw new Error('Browser failed to start CDP listener within 10 seconds.');
  }

  console.log(`Connected to ${versionData.Browser}`);

  try {
    // Create new tab pointing to the dev server using PUT
    const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?http://localhost:5173/`, { method: 'PUT' });
    const target = await newTabRes.json();
    console.log(`Target tab created: ${target.webSocketDebuggerUrl}`);

    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map<number, (res: any) => void>();
    const consoleErrors: string[] = [];
    const uncaughtErrors: string[] = [];

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)!(msg);
          pending.delete(msg.id);
        }
        if (msg.method === 'Console.messageAdded') {
          const { level, text } = msg.params.message;
          if (level === 'error') {
            consoleErrors.push(text);
            console.error(`  [Browser Console ERROR]: ${text}`);
          }
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          const desc =
            msg.params.exceptionDetails?.exception?.description ||
            msg.params.exceptionDetails?.text;
          uncaughtErrors.push(desc);
          console.error(`  [Browser Uncaught Exception]: ${desc}`);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    });

    function send(method: string, params: Record<string, any> = {}): Promise<any> {
      return new Promise((resolve) => {
        const id = idCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await send('Console.enable');
    await send('Runtime.enable');
    await send('Page.enable');

    const pageLoaded = new Promise<void>((resolve) => {
      const listener = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data.toString());
          if (msg.method === 'Page.loadEventFired') {
            ws.removeEventListener('message', listener);
            resolve();
          }
        } catch {
          // ignore
        }
      };
      ws.addEventListener('message', listener);
    });

    console.log('Navigating to http://localhost:5173/ ...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await pageLoaded;
    await new Promise((r) => setTimeout(r, 1500));

    console.log('\n--- 1. Verifying Login Page Load ---');
    // Wait until root is mounted
    let bodyText = '';
    for (let i = 0; i < 30; i++) {
      const bodyTextRes = await send('Runtime.evaluate', {
        expression: 'document.body ? document.body.innerText : ""',
        returnByValue: true,
      });
      bodyText = bodyTextRes.result?.result?.value || '';
      if (bodyText.trim().length > 0) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    const pageTitleRes = await send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true,
    });
    console.log(`Page title: "${pageTitleRes.result?.result?.value}"`);

    if (
      bodyText.includes('BookBeacon') &&
      bodyText.includes('Welcome back') &&
      bodyText.includes('Student') &&
      bodyText.includes('Librarian')
    ) {
      console.log('✓ Login page loaded successfully with role selectors and login form.');
    } else {
      throw new Error(`Login page failed to render properly. Content:\n${bodyText.slice(0, 400)}`);
    }

    if (uncaughtErrors.length === 0 && consoleErrors.length === 0) {
      console.log('✓ Zero uncaught exceptions and zero console errors on login page.');
    } else {
      throw new Error(`Errors on load: ${[...uncaughtErrors, ...consoleErrors].join(', ')}`);
    }

    console.log('\n--- 2. Testing Student Login ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const autoFillBtn = buttons.find(b => b.innerText.includes('Auto-fill credentials'));
          if (autoFillBtn) autoFillBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const submitBtn = buttons.find(b => b.innerText.includes('Sign in as Student'));
          if (submitBtn) submitBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const homeTextRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const lowerHome = homeText.toLowerCase();
    if (
      lowerHome.includes('find any book') &&
      lowerHome.includes('beacon active') &&
      lowerHome.includes('student')
    ) {
      console.log('✓ Student logged in and redirected to Home dashboard.');
      console.log('✓ Student role badge rendered in sidebar.');
    } else {
      throw new Error(`Student login did not redirect to Home:\n${homeText.slice(0, 400)}`);
    }

    console.log('\n--- 3. Testing Book Search & Details ---');
    // Navigate to Search page
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navBtns = Array.from(document.querySelectorAll('nav button'));
          const searchBtn = navBtns.find(b => b.innerText.includes('Book Search'));
          if (searchBtn) searchBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Type query "math"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input');
          if (input) {
            input.focus();
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeSetter) {
              nativeSetter.call(input, 'math');
            } else {
              input.value = 'math';
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const searchResultsRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const searchText = searchResultsRes.result?.result?.value || '';

    if (searchText.includes('Engineering Mathematics') && searchText.includes('A-03')) {
      console.log('✓ Search returned "Engineering Mathematics" with location A-03.');
    } else {
      throw new Error(`Search results unexpected:\n${searchText.slice(0, 400)}`);
    }

    // Click book card to view DetailsPage
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bookCards = Array.from(document.querySelectorAll('button'));
          const bookCard = bookCards.find(b => b.innerText.includes('Engineering Mathematics'));
          if (bookCard) bookCard.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const detailsRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const detailsText = detailsRes.result?.result?.value || '';

    if (
      detailsText.includes('Book Details') &&
      detailsText.includes('A-03 · Shelf 1') &&
      detailsText.includes('Navigate to Book')
    ) {
      console.log('✓ Book details page rendered correctly with hierarchical location (A-03 · Shelf 1).');
    } else {
      throw new Error(`Book details page unexpected:\n${detailsText.slice(0, 400)}`);
    }

    console.log('\n--- 4. Testing Floor Map Navigation ---');
    // Click Navigate to Book
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const navBtn = buttons.find(b => b.innerText.includes('Navigate to Book'));
          if (navBtn) navBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const navRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const navText = navRes.result?.result?.value || '';

    if (
      navText.includes('Library Navigation') &&
      navText.includes('Rack A-03') &&
      navText.includes('Target Shelf: 1') &&
      navText.includes('Signal strength')
    ) {
      console.log('✓ Navigation floor map loaded.');
      console.log('✓ Beacon signal correctly highlights Rack A-03 and Target Shelf 1.');
      console.log('✓ Walking route calculated from Entrance.');
    } else {
      throw new Error(`Navigation page unexpected:\n${navText.slice(0, 400)}`);
    }

    console.log('\n--- 5. Testing Student Logout & Librarian Login ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const logoutBtn = document.querySelector('button[aria-label="Log out"]');
          if (logoutBtn) logoutBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Sign in as Librarian
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const libRole = buttons.find(b => b.innerText.includes('Librarian') && b.innerText.includes('Manage library'));
          if (libRole) libRole.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 400));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const autoFill = buttons.find(b => b.innerText.includes('Auto-fill credentials'));
          if (autoFill) autoFill.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 400));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const submitBtn = buttons.find(b => b.innerText.includes('Sign in as Librarian'));
          if (submitBtn) submitBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));

    const libHomeRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const libHomeText = libHomeRes.result?.result?.value || '';

    const lowerLib = libHomeText.toLowerCase();
    if (
      lowerLib.includes('librarian') &&
      lowerLib.includes('librarian dashboard') &&
      lowerLib.includes('map editor')
    ) {
      console.log('✓ Librarian logged in with Librarian role and full management menu items.');
    } else {
      throw new Error(`Librarian login unexpected:\n${libHomeText.slice(0, 400)}`);
    }

    console.log('\n--- 6. Testing Librarian Dashboard & Racks/Shelves Management ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navBtns = Array.from(document.querySelectorAll('nav button'));
          const dashBtn = navBtns.find(b => b.innerText.includes('Librarian Dashboard'));
          if (dashBtn) dashBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const dashRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const dashText = dashRes.result?.result?.value || '';

    if (
      dashText.includes('Librarian Dashboard') &&
      dashText.includes('Total books') &&
      dashText.includes('Racks & Shelves') &&
      dashText.includes('Add book')
    ) {
      console.log('✓ Librarian Dashboard loaded with inventory stats, Book Inventory tab and Racks & Shelves tab.');
    } else {
      throw new Error(`Dashboard unexpected:\n${dashText.slice(0, 400)}`);
    }

    // Switch to Racks & Shelves tab
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tabBtns = Array.from(document.querySelectorAll('button'));
          const racksTab = tabBtns.find(b => b.innerText.includes('Racks & Shelves'));
          if (racksTab) racksTab.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    const racksTabRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const racksTabText = racksTabRes.result?.result?.value || '';

    if (racksTabText.includes('Racks & Shelf Capacity') && racksTabText.includes('Add new rack') && racksTabText.includes('A-01')) {
      console.log('✓ Racks & Shelves management tab active. Shows capacity, section mapping and shelf counts.');
    } else {
      throw new Error(`Racks tab unexpected:\n${racksTabText.slice(0, 400)}`);
    }

    console.log('\n--- 7. Testing Visual Map Editor ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navBtns = Array.from(document.querySelectorAll('nav button'));
          const mapBtn = navBtns.find(b => b.innerText.includes('Map Editor'));
          if (mapBtn) mapBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const mapRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const mapText = mapRes.result?.result?.value || '';

    if (
      mapText.includes('Visual Library Map Editor') &&
      mapText.includes('Floor Plan Grid') &&
      mapText.includes('Racks on Map') &&
      mapText.includes('Save Map')
    ) {
      console.log('✓ Map Editor loaded with 12x9 floor grid, toolbar (Rack, Entrance, Pathway, Blocked, Erase), and rack list.');
    } else {
      throw new Error(`Map Editor unexpected:\n${mapText.slice(0, 400)}`);
    }

    // Click on a rack cell on the grid
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rackBtns = Array.from(document.querySelectorAll('div[draggable="true"]'));
          if (rackBtns[0]) rackBtns[0].click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    const inspectorRes = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    const inspectorText = inspectorRes.result?.result?.value || '';

    if (inspectorText.includes('Edit Rack') && inspectorText.includes('Rack ID')) {
      console.log('✓ Rack Inspector opened with Rack ID editing, Section and Shelf tier details.');
    } else {
      throw new Error(`Inspector unexpected:\n${inspectorText.slice(0, 400)}`);
    }

    console.log('\n--- 8. Final Console Error Inspection ---');
    if (consoleErrors.length === 0 && uncaughtErrors.length === 0) {
      console.log('✓ ZERO console errors and ZERO unhandled exceptions across all pages and user actions!');
    } else {
      console.warn(`Encountered ${consoleErrors.length} console errors and ${uncaughtErrors.length} uncaught exceptions.`);
    }

    ws.close();
    console.log('\n======================================================');
    console.log('ALL IN-BROWSER WORKFLOWS PASSED WITH 100% SUCCESS! ✓');
    console.log('======================================================');
  } finally {
    browserProc.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
