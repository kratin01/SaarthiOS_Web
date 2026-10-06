import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { installFilm } from './demo-film.mjs';

const tools = createRequire(join(process.env.DEMO_TOOLS || join(tmpdir(), 'saarthios-video-tools'), 'package.json'));
const { chromium } = tools('playwright');
const ffmpeg = tools('ffmpeg-static');
const baseUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173';
assert(['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname), 'Capture only a local dev server.');
const output = resolve(dirname(fileURLToPath(import.meta.url)), '../public/demo');
const scratch = await mkdtemp(join(tmpdir(), 'saarthios-film-'));
const date = '2026-10-06T12:00:00.000Z';
const message = 'Spent 250 on lunch and 80 on an auto. Had 2 rotis and dal for dinner.';
const question = 'How much did I spend on food today?';
const paging = (total) => ({ limit: 30, offset: 0, total, hasMore: false });
const user = {
  _id: 'demo-user', name: 'Aarav', email: 'demo@example.invalid', currency: 'INR',
  tutorialStatus: 'completed', customCategories: [], monthlyBudget: null,
  dailyCalorieGoal: 2000, dailyProteinGoal: 90, isAdmin: false
};
const status = {
  notice: '', services: {
    database: { ok: true, notice: '' }, ai: { ok: true, configured: true, notice: '' },
    prices: { ok: true, notice: '' }, import: { ok: true, notice: '' }, google: { enabled: false }
  }
};
const run = {
  _id: 'demo-run', message,
  reply: 'Expenses of INR 330 recorded. Meal logged: roti (2), dal (1 katori). Roughly 420 kcal, 18 g protein. These are estimates for that portion.',
  intent: 'record', status: 'completed', createdAt: date, durationMs: 2300,
  agentsUsed: ['expense', 'health'], created: { expenses: 2, meals: 1, investments: 0, subscriptions: 0, custom: 0 },
  steps: [
    { agent: 'orchestrator', label: 'Understanding your message', status: 'done', detail: '', at: date },
    { agent: 'expense', label: 'Expense Agent', status: 'done', detail: '2 expenses recorded', at: date },
    { agent: 'health', label: 'Health Agent', status: 'done', detail: '1 meal logged', at: date }
  ]
};
const answer = {
  ...run, _id: 'demo-answer', message: question, intent: 'query', agentsUsed: [], steps: [],
  created: { expenses: 0, meals: 0, investments: 0, subscriptions: 0, custom: 0 },
  reply: 'You spent **INR 250 on food today**. That was your lunch.\n\nYour INR 80 auto ride is under transport, so it is not included in your food total.'
};
const expenses = [
  { _id: 'lunch', amount: 250, category: 'food', merchant: 'Lunch', note: '', date, source: 'chat' },
  { _id: 'auto', amount: 80, category: 'transport', merchant: 'Auto ride', note: '', date, source: 'chat' }
];
const byCategory = [
  { category: 'food', amount: 250, count: 1 },
  { category: 'transport', amount: 80, count: 1 }
];
const series = Array.from({ length: 7 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 8, 30 + index)).toISOString().slice(0, 10),
  amount: index === 6 ? 330 : 0, calories: index === 6 ? 420 : 0
}));
const recent = [
  ...expenses.map((expense) => ({ id: expense._id, kind: 'expense', title: expense.merchant, subtitle: expense.category, amount: expense.amount, date })),
  { id: 'meal', kind: 'meal', title: 'Dinner', subtitle: 'Roti and dal', amount: null, date }
];
let recorded = false;
let queried = false;
const browser = await chromium.launch({ channel: process.env.DEMO_BROWSER || 'msedge', headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const unhandled = [];
  await context.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const headers = {
      'access-control-allow-origin': new URL(baseUrl).origin,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type'
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let body;
    if (path === '/status') body = status;
    else if (path === '/auth/me') body = { user };
    else if (path === '/agents') body = { agents: [], max: 2 };
    else if (path === '/chat/status') body = { configured: true, label: 'Sample session', model: 'Product demo' };
    else if (path === '/chat/conversations') body = {
      conversations: recorded ? [{ _id: 'demo-thread', title: 'A day in one message', lastMessageAt: date, messageCount: queried ? 2 : 1 }] : [],
      page: paging(recorded ? 1 : 0)
    };
    else if (path === '/chat/conversations/demo-thread') body = {
      conversation: { _id: 'demo-thread' }, runs: queried ? [run, answer] : [run],
      page: { limit: 30, total: queried ? 2 : 1, oldestIndex: 0, hasEarlier: false }
    };
    else if (path === '/chat' && route.request().method() === 'POST') {
      const sent = route.request().postDataJSON().message;
      assert([message, question].includes(sent));
      recorded = true;
      queried = sent === question;
      body = { run: queried ? answer : run, conversationId: 'demo-thread' };
    } else if (path === '/dashboard') body = {
      currency: 'INR', period: 'today', periodLabel: 'today', previousLabel: 'yesterday', generatedAt: date,
      expenses: { total: 330, previous: 0, changePct: 100, budget: null, byCategory, series },
      health: { totals: { calories: 420, protein: 18, carbs: 66, fat: 10, meals: 1 }, calorieGoal: 2000, loggedDays: 1, dailyAverage: 420, series },
      recent, recentPage: paging(3), insights: []
    };
    else if (path === '/expenses') body = {
      items: expenses, page: paging(2),
      summary: { range: 'this month', total: 330, count: 2, byCategory, byDay: series.slice(1), topMerchants: [] }
    };
    else {
      unhandled.push(path);
      await route.abort();
      return;
    }
    await route.fulfill({ json: body, headers });
  });
  await context.addInitScript(() => {
    localStorage.setItem('saarthios.token', 'local-render-fixture');
    localStorage.setItem('saarthios.theme', 'light');
    localStorage.setItem('saarthios.chatHistoryOpen', 'false');
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date(date) });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/chat`);
  await page.getByRole('textbox').waitFor().catch(async (error) => {
    throw new Error(`${error.message}\n${page.url()}\n${await page.locator('body').innerText()}\n${JSON.stringify({ errors, unhandled })}`);
  });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; scroll-behavior: auto !important; }' });
  const images = {};
  const capture = async (name, locator) => {
    images[name] = `data:image/png;base64,${(await locator.screenshot()).toString('base64')}`;
  };
  const captureMain = async (name, height = 620) => {
    const bounds = await page.locator('main').boundingBox();
    assert(bounds, 'The app shell must have a main element.');
    images[name] = `data:image/png;base64,${(await page.screenshot({ clip: { x: bounds.x, y: 0, width: bounds.width, height } })).toString('base64')}`;
  };
  const words = message.split(' ');
  for (let count = 0; count <= words.length; count += 1) {
    await page.getByRole('textbox').fill(words.slice(0, count).join(' '));
    await capture(`typing${count}`, page.getByRole('textbox').locator('..'));
  }
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText(/Expenses of INR 330 recorded/).waitFor();
  await capture('saved', page.locator('.space-y-3.animate-fade-up').last());
  await page.getByRole('button', { name: /agents ran/ }).click();
  await capture('agents', page.locator('.space-y-3.animate-fade-up').last());
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await page.getByText('420 kcal', { exact: true }).waitFor();
  await page.locator('.recharts-area-curve').first().waitFor({ state: 'attached' });
  await page.clock.runFor(2000);
  await captureMain('dashboard');
  await page.getByRole('link', { name: 'Expenses', exact: true }).click();
  await page.getByText('Average per transaction', { exact: true }).waitFor();
  await page.locator('.recharts-sector').first().waitFor({ state: 'attached' });
  await page.clock.runFor(2000);
  await captureMain('expenses', 790);
  await page.getByRole('link', { name: 'Assistant', exact: true }).click();
  await page.getByText(/Expenses of INR 330 recorded/).waitFor();
  await page.getByRole('textbox').fill(question);
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('INR 250 on food today', { exact: false }).waitFor();
  await capture('answer', page.locator('.space-y-3.animate-fade-up').last());
  assert.deepEqual(unhandled, [], 'Every API request must be handled by local fixtures.');
  assert.deepEqual(errors, [], 'The captured app must not have browser errors.');

  await page.setContent('<canvas width="1600" height="900"></canvas>');
  await page.evaluate(installFilm, { images, wordCount: words.length });
  await mkdir(output, { recursive: true });
  const frame = async (time, quality = 0.9) => Buffer.from(await page.evaluate(({ time, quality }) => {
    window.drawFilm(time);
    return document.querySelector('canvas').toDataURL('image/jpeg', quality).split(',')[1];
  }, { time, quality }), 'base64');
  await writeFile(join(output, 'saarthios-demo.jpg'), await frame(-1, 0.94));
  for (const time of [1.5, 6, 11, 17, 23, 28, 32]) {
    await writeFile(join(scratch, `scene-${time}.jpg`), await frame(time));
  }
  console.log(`Scene previews: ${scratch}`);
  if (!process.argv.includes('--preview')) {
    const duration = 34;
    const rate = 44100;
    const audio = Buffer.alloc(44 + duration * rate * 2);
    audio.write('RIFF', 0);
    audio.writeUInt32LE(audio.length - 8, 4);
    audio.write('WAVEfmt ', 8);
    audio.writeUInt32LE(16, 16);
    audio.writeUInt16LE(1, 20);
    audio.writeUInt16LE(1, 22);
    audio.writeUInt32LE(rate, 24);
    audio.writeUInt32LE(rate * 2, 28);
    audio.writeUInt16LE(2, 32);
    audio.writeUInt16LE(16, 34);
    audio.write('data', 36);
    audio.writeUInt32LE(audio.length - 44, 40);
    const notes = [293.66, 369.99, 440, 554.37, 440, 369.99, 329.63, 440];
    for (let sample = 0; sample < duration * rate; sample += 1) {
      const time = sample / rate;
      const beat = time * 1.8;
      const phase = (beat % 0.5) / 1.8;
      const frequency = notes[Math.floor(beat * 2) % notes.length];
      const pluck = (Math.sin(time * frequency * Math.PI * 2) + 0.2 * Math.sin(time * frequency * Math.PI * 4)) * Math.exp(-phase * 13) * Math.min(1, phase * 200);
      const beatTime = (beat % 1) / 1.8;
      const kick = Math.sin(2 * Math.PI * (48 * beatTime + 2 * (1 - Math.exp(-beatTime * 35)))) * Math.exp(-beatTime * 18);
      const bass = Math.sin(time * (Math.floor(beat / 8) % 2 ? 82.41 : 73.42) * Math.PI * 2) * 0.15;
      const fade = Math.min(1, time / 1.5, (duration - time) / 2);
      audio.writeInt16LE(Math.round((pluck * 0.13 + kick * 0.13 + bass) * fade * 18000), 44 + sample * 2);
    }
    const audioPath = join(scratch, 'original-score.wav');
    await writeFile(audioPath, audio);
    const moviePath = join(output, 'saarthios-demo.rendering.mp4');
    const encoder = spawn(ffmpeg, [
      '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '24', '-vcodec', 'mjpeg', '-i', 'pipe:0',
      '-i', audioPath, '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', moviePath
    ], { stdio: ['pipe', 'ignore', 'pipe'] });
    let encoderError = '';
    encoder.stderr.on('data', (chunk) => { encoderError += chunk.toString(); });
    const completed = once(encoder, 'close');
    for (let index = 0; index < duration * 24; index += 1) {
      if (!encoder.stdin.write(await frame(index / 24))) await once(encoder.stdin, 'drain');
      if (index % 120 === 0) console.log(`Rendered ${index / 24}s / ${duration}s`);
    }
    encoder.stdin.end();
    const [code] = await completed;
    assert.equal(code, 0, encoderError);
    await rename(moviePath, join(output, 'saarthios-demo.mp4'));
    const movie = await readFile(join(output, 'saarthios-demo.mp4'));
    console.log(`Rendered 1600x900, ${duration}s, 24 fps, ${(movie.length / 1024 / 1024).toFixed(2)} MB.`);
  }
} finally {
  await browser.close();
}