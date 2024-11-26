const http = require('http');
const Waline = require('@waline/vercel');
const serverless = require('serverless-http');
const fetch = require('node-fetch'); // 确保已安装 node-fetch 模块

const app = Waline({
  env: 'netlify',
  async postSave(comment) {
    console.log('New comment received:', comment);

    // 添加测试代码来验证对 Server酱 API 的连接
    const testUrl = 'https://sctapi.ftqq.com/test';
    try {
      const response = await fetch(testUrl, { method: 'GET' });
      if (response.ok) {
        console.log('Connection to Server酱 API successful:', await response.json());
      } else {
        console.error('Failed to connect to Server酱 API:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error during connection test:', error.message);
    }

    // 在此处继续处理其他逻辑
  },
});

module.exports.handler = serverless(http.createServer(app));
