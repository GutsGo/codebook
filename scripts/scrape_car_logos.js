import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 目标下载目录，相对于当前脚本
const targetDir = path.resolve(__dirname, '../public/images/car-logos');

// 延时函数
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 获取随机延时，防止触发访问频率限制
const randomDelay = (min = 1000, max = 3000) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(ms);
};

async function run() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    // macOS 本地 Chrome 默认安装路径
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false, // 设为 false 让浏览器显式打开，模拟真人
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const page = await browser.newPage();

  // 设置真实存在的 User-Agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // 修改 navigator.webdriver 标志以防止被检测
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  // 监听浏览器控制台输出，将其转发到 Node.js 终端
  page.on('console', (msg) => {
    console.log(`[浏览器控制台] ${msg.text()}`);
  });

  const baseUrl = 'https://www.autohome.com.cn/carlogo';
  console.log(`正在访问: ${baseUrl}`);

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (err) {
    console.log('页面加载完成或超时，尝试继续解析...');
  }

  console.log('正在从页面 JSON 数据中提取品牌信息...');
  const allLogos = await page.evaluate(() => {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript) {
      console.log('未找到 __NEXT_DATA__ 脚本标签');
      return [];
    }

    try {
      console.log('成功找到脚本标签，正在解析 JSON...');
      const json = JSON.parse(nextDataScript.innerText);
      console.log('JSON 解析成功，检查数据结构...');

      // 深度打印键名调试
      console.log('Root keys: ' + Object.keys(json).join(', '));
      if (json.props) console.log('Props keys: ' + Object.keys(json.props).join(', '));
      if (json.props && json.props.pageProps) console.log('pageProps keys: ' + Object.keys(json.props.pageProps).join(', '));

      // 修正：数据直接在 pageProps 下，没有 data 层级
      const brandData = json?.props?.pageProps?.brandData || [];
      const hotData = json?.props?.pageProps?.hotData || [];

      console.log(`找到热门品牌: ${hotData.length} 个, 普通品牌: ${brandData.length} 个`);

      // 合并品牌数据
      const combined = [...hotData, ...brandData];

      const items = [];
      const urls = new Set();

      combined.forEach((item) => {
        const url = item.brandLogo;
        if (url && !urls.has(url)) {
          urls.add(url);
          // 提取格式
          const ext = url.split('.').pop().split('?')[0] || 'png';
          // 使用名字作为文件名，去除非法字符
          const cleanName = item.name.replace(/[\\\/\:\*\?\"\<\>\|]/g, '_');
          items.push({
            url: url,
            name: item.name,
            filename: `${cleanName}.${ext}`,
          });
        }
      });
      return items;
    } catch (e) {
      return [];
    }
  });

  if (allLogos.length === 0) {
    console.error('未能成功提取到车标数据。');
    await browser.close();
    return;
  }

  console.log(`\n提取完毕！共发现 ${allLogos.length} 个车标。开始顺序下载...`);

  let successCount = 0;
  for (let i = 0; i < allLogos.length; i++) {
    const { url, filename, name } = allLogos[i];
    const savePath = path.join(targetDir, filename);

    if (fs.existsSync(savePath)) {
      console.log(`[${i + 1}/${allLogos.length}] ${name} 已存在，跳过。`);
      successCount++;
      continue;
    }

    try {
      console.log(`[${i + 1}/${allLogos.length}] 下载中: ${name}...`);

      // 使用 fetch 获取流
      const base64 = await page.evaluate(async (imgUrl) => {
        try {
          const res = await fetch(imgUrl);
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          return null;
        }
      }, url);

      if (base64) {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(savePath, buffer);
        successCount++;

        // 适当延时
        await randomDelay(200, 800);
      } else {
        console.error(`  >> 下载失败: ${name}`);
      }
    } catch (err) {
      console.error(`  >> 下载异常: ${name} - ${err.message}`);
    }
  }

  console.log(`\n全部完成！成功抓取 ${successCount} 个车标。保存路径: ${targetDir}`);
  await browser.close();
}

run().catch(console.error);
