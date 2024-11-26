const http = require('http');
const Waline = require('@waline/vercel');
const serverless = require('serverless-http');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = Waline({
  env: 'netlify',
  async postSave(comment) {
    console.log('New comment received:', comment);

    // 获取环境变量
    const { SC_KEY, SITE_NAME, SITE_URL } = process.env;

    if (!SC_KEY) {
      console.error('SC_KEY not defined in environment variables.');
      return false;
    }

    // 准备数据
    const data = {
      self: comment,
      site: {
        name: SITE_NAME || 'Default Site Name',
        url: SITE_URL || 'https://default.site.url',
        postUrl: (SITE_URL || 'https://default.site.url') + comment.url + '#' + comment.objectId,
      },
    };

    // 使用模板准备 Server 酱内容
    const contentTemplate = `
💬 ${data.site.name} 有新评论啦
【评论者昵称】：${data.self.nick}
【评论者邮箱】：${data.self.mail || '未提供'}
【内容】：${data.self.comment}
【地址】：${data.site.postUrl}
`;
    const title = `${data.site.name} - 新评论通知`;

    // 构建表单数据
    const form = new FormData();
    form.append('text', title);
    form.append('desp', contentTemplate);

    try {
      // 发起 POST 请求
      const response = await fetch(`https://sctapi.ftqq.com/${SC_KEY}.send`, {
        method: 'POST',
        headers: form.getHeaders(),
        body: form,
      });

      const result = await response.json();
      if (response.ok && result.code === 0) {
        console.log('Server酱通知成功:', result);
      } else {
        console.error('Server酱通知失败:', result);
      }
    } catch (error) {
      console.error('Error sending Server酱 notification:', error.message);
    }
  },
});

module.exports.handler = serverless(http.createServer(app));
