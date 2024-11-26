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
    const { SC_KEY, SITE_NAME, SITE_URL, PUSH_PLUS_KEY } = process.env;

    // 准备数据
    const data = {
      self: comment,
      site: {
        name: SITE_NAME || 'Default Site Name',
        url: SITE_URL || 'https://default.site.url',
        postUrl: (SITE_URL || 'https://default.site.url') + comment.url + '#' + comment.objectId,
      },
    };

    // 使用模板准备内容
    const contentTemplate = `
💬 ${data.site.name} 有新评论啦
【评论者昵称】：${data.self.nick}
【评论者邮箱】：${data.self.mail || '未提供'}
【内容】：${data.self.comment}
【地址】：${data.site.postUrl}
`;
    const contentTemplate = `
💬 LengM 新评论通知
----------------------------
站点名称: LengM
评论页面: ${data.site.postUrl}
评论内容:
${data.self.comment}

评论者昵称: ${data.self.nick}
评论者邮箱: ${data.self.mail || '未提供'}
IP 地址: ${data.self.ip || '未知'}
评论时间: ${new Date(data.self.createdAt).toLocaleString()}

浏览器信息: ${data.self.ua || '未知'}
`;

    const title = `LengM - 新评论通知`;

    let success = false;

    // Server酱通知
    if (SC_KEY) {
      const form = new FormData();
      form.append('text', title);
      form.append('desp', contentTemplate);

      try {
        const response = await fetch(`https://sctapi.ftqq.com/${SC_KEY}.send`, {
          method: 'POST',
          headers: form.getHeaders(),
          body: form,
        });

        const result = await response.json();
        if (response.ok && result.code === 0) {
          console.log('Server酱通知成功:', result);
          success = true;
        } else {
          console.error('Server酱通知失败:', result);
        }
      } catch (error) {
        console.error('Error sending Server酱 notification:', error.message);
      }
    } else {
      console.error('SC_KEY not defined in environment variables.');
    }

    // PushPlus通知
    if (PUSH_PLUS_KEY) {
      try {
        const pushplusResponse = await fetch('http://www.pushplus.plus/send/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `token=${PUSH_PLUS_KEY}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(contentTemplate)}&template=html`,
        });

        const pushplusResult = await pushplusResponse.json();
        if (pushplusResponse.ok && pushplusResult.code === 200) {
          console.log('PushPlus通知成功:', pushplusResult);
          success = true;
        } else {
          console.error('PushPlus通知失败:', pushplusResult);
        }
      } catch (error) {
        console.error('Error sending PushPlus notification:', error.message);
      }
    } else {
      console.error('PUSH_PLUS_KEY not defined in environment variables.');
    }

    // 检查是否有任何通知成功
    if (!success) {
      console.error('两种通知方式均失败。');
      return false;
    }
  },
});

module.exports.handler = serverless(http.createServer(app));
