/**
 * 本研究原创的只读核验工具。下载固定提交的公开材料，在隔离的虚拟 POSIX
 * 文件系统中执行上游 prepare-digest.js；不读取真实用户配置，不调用发送接口。
 * 需要 Node.js 20+，运行时加 --experimental-vm-modules。源码仅保留在内存。
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { posix } from 'node:path';
import vm from 'node:vm';

const commit = 'c8da0e7ece27d6a0007b53f54f546bf0ff1086d4';
const base = `https://raw.githubusercontent.com/zarazhangrui/follow-builders/${commit}/`;
const liveBase = 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/';
const promptNames = ['summarize-podcast.md', 'summarize-tweets.md', 'summarize-blogs.md', 'digest-intro.md', 'translate.md'];
const paths = ['scripts/prepare-digest.js', 'SKILL.md', 'config/default-sources.json',
  'feed-x.json', 'feed-podcasts.json', 'feed-blogs.json', ...promptNames.map(n => `prompts/${n}`)];
const materials = new Map();
for (const path of paths) {
  const res = await fetch(base + path, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  materials.set(path, await res.text());
}

async function run({ config = { language: 'zh', frequency: 'daily', delivery: { method: 'stdout' } },
  custom = {}, promptFailure = null, feedFailure = false, blogsOnly = false } = {}) {
  const files = new Map([['/user/.follow-builders/config.json', JSON.stringify(config)]]);
  for (const n of promptNames) files.set('/study/prompts/' + n, materials.get('prompts/' + n));
  for (const [n, value] of Object.entries(custom)) files.set('/user/.follow-builders/prompts/' + n, value);
  const requests = [];
  let stderr = '';
  let resolve;
  const done = new Promise(r => { resolve = r; });
  const context = vm.createContext({
    URL,
    console: {
      log: message => resolve({ exitCode: 0, output: JSON.parse(message), requests }),
      error: message => { stderr += String(message); }
    },
    process: { exit: code => resolve({ exitCode: code, stderr, requests }) },
    fetch: async url => {
      assert.ok(url.startsWith(liveBase), '只允许被审查过的上游内容路径');
      const path = url.slice(liveBase.length);
      requests.push(path);
      if (path.startsWith('prompts/') && promptFailure === 'network') throw new Error('fixture: network unavailable');
      if ((path.startsWith('prompts/') && promptFailure === 'http') || (path.startsWith('feed-') && feedFailure)) {
        return new Response('', { status: 503 });
      }
      if (blogsOnly && path.startsWith('feed-')) {
        const fixture = path === 'feed-x.json' ? { x: [] } : path === 'feed-podcasts.json' ? { podcasts: [] } :
          { blogs: [{ source: 'blog', title: 'Synthetic probe fixture', url: 'https://example.org/probe', content: 'Fixture only.' }] };
        return new Response(JSON.stringify(fixture));
      }
      assert.ok(materials.has(path), `未准备的数据路径：${path}`);
      return new Response(materials.get(path));
    }
  });
  const exports = {
    'fs/promises': { readFile: async p => { assert.ok(files.has(p), `不存在的虚拟文件：${p}`); return files.get(p); }, mkdir: async () => { throw new Error('禁止写文件'); } },
    fs: { existsSync: p => files.has(p) },
    path: { join: posix.join },
    os: { homedir: () => '/user' }
  };
  const module = new vm.SourceTextModule(materials.get('scripts/prepare-digest.js'), {
    context, initializeImportMeta: meta => { meta.url = 'file:///study/scripts/prepare-digest.js'; }
  });
  await module.link(name => {
    assert.ok(exports[name], `不允许的模块：${name}`);
    const values = exports[name];
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  let timer;
  try {
    return await Promise.race([done, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('隔离核验超时')), 10000);
    })]);
  } finally { clearTimeout(timer); }
}

const cases = [];
const baseline = await run();
assert.equal(baseline.exitCode, 0);
assert.equal(baseline.output.config.language, 'zh');
assert.equal(baseline.output.stats.xBuilders, 14);
assert.equal(baseline.output.stats.totalTweets, 28);
assert.equal(Object.keys(baseline.output.prompts).length, 5);
assert.equal(baseline.requests.length, 8);
cases.push({ name: '读取固定快照与五份提示词', passed: true, observation: '14 位作者、28 条动态；3 个 feed 加 5 份 prompt，共 8 次请求。' });

const custom = await run({ custom: { 'summarize-tweets.md': '本地自定义规则' } });
assert.equal(custom.output.prompts.summarize_tweets, '本地自定义规则');
assert.equal(custom.requests.length, 7);
cases.push({ name: '用户提示词优先', passed: true, observation: '用户规则覆盖远程规则，少一次远程请求。' });

const fallback = await run({ promptFailure: 'http' });
assert.equal(fallback.exitCode, 0);
assert.equal(fallback.output.prompts.summarize_tweets, materials.get('prompts/summarize-tweets.md'));
cases.push({ name: '远程提示词 HTTP 503', passed: true, observation: '虚拟 POSIX 环境中成功回退本地提示词。' });

const networkFailure = await run({ promptFailure: 'network' });
assert.equal(networkFailure.exitCode, 1);
cases.push({ name: '远程提示词网络异常', passed: true, observation: '复现缺陷：fetch 抛异常时整个准备过程失败，没有进入本地回退。' });

const noFeeds = await run({ feedFailure: true });
assert.equal(noFeeds.exitCode, 0);
assert.equal(noFeeds.output.status, 'ok');
assert.equal(noFeeds.output.stats.totalTweets, 0);
assert.equal(noFeeds.output.errors.length, 3);
cases.push({ name: '三个 feed 都返回 HTTP 503', passed: true, observation: '复现状态歧义：status 仍为 ok，内容为空，errors 记录三个失败。' });

const weekly = await run({ config: { language: 'zh', frequency: 'weekly', delivery: { method: 'stdout' } } });
const body = r => JSON.stringify([r.output.x, r.output.podcasts, r.output.blogs]);
assert.equal(body(weekly), body(baseline));
cases.push({ name: '周报设置的数据覆盖范围', passed: true, observation: 'daily 与 weekly 读取同一批内容，没有历史聚合。' });

assert.equal(body(await run()), body(baseline));
cases.push({ name: '重复读取', passed: true, observation: '相同快照再次读取，内容相同；准备脚本没有用户级已读去重。' });

const blogs = await run({ blogsOnly: true });
assert.equal(blogs.output.stats.blogPosts, 1);
assert.equal(blogs.output.stats.xBuilders, 0);
assert.equal(blogs.output.stats.podcastEpisodes, 0);
assert.match(materials.get('SKILL.md'), /stats\.podcastEpisodes[^\n]*0 AND[^\n]*stats\.xBuilders[^\n]*0/);
cases.push({ name: '只有博客的输入', passed: true, observation: '准备脚本保留博客；静态检查发现 Skill 的无内容条件只检查 X 和播客，存在提前停止风险。测试博客为合成数据。' });

const sources = JSON.parse(materials.get('config/default-sources.json'));
const feeds = ['x', 'podcasts', 'blogs'].map(type => {
  const feed = JSON.parse(materials.get(`feed-${type}.json`));
  return { type, generatedAt: feed.generatedAt, lookbackHours: feed.lookbackHours, stats: feed.stats, errors: feed.errors || [] };
});
console.log(JSON.stringify({
  upstream: 'https://github.com/zarazhangrui/follow-builders', commit,
  verifiedAt: new Date().toISOString(), runtime: process.version,
  method: '固定提交公开材料 + 上游准备脚本在虚拟 POSIX 文件系统中隔离执行；采集、模型生成和外部发送未运行。',
  sourceCounts: { x: sources.x_accounts.length, podcasts: sources.podcasts.length, blogs: sources.blogs.length },
  feeds, cases,
  materials: [...materials].map(([path, content]) => ({ path, url: base + path, sha256: createHash('sha256').update(content).digest('hex') }))
}, null, 2));
