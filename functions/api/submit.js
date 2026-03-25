export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 如果你在 Cloudflare Dashboard 中绑定了 KV namespace
    // 这里做了兼容：你可以将变量名(Variable Name)设为 WAITLIST_KV 或者 MAILCLAW_WAITLIST_EMAILS
    const kvStore = env.MAILCLAW_WAITLIST_EMAILS || env.WAITLIST_KV;
    
    if (kvStore) {
      // key-value: email -> 提交的时间等信息
      await kvStore.put(email, JSON.stringify({ 
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('cf-connecting-ip') // Cloudflare 会传递真实 IP
      }));
    } else if (env.DB) {
      // 备选方案：如果你绑定了 D1 数据库 (变量名设为 DB)
      // 需要先建表: CREATE TABLE IF NOT EXISTS waitlist (email TEXT PRIMARY KEY, timestamp TEXT);
      const stmt = env.DB.prepare('INSERT INTO waitlist (email, timestamp) VALUES (?1, ?2)');
      await stmt.bind(email, new Date().toISOString()).run();
    } else {
      // 如果没有配置任何绑定，仅仅打印日志（可在 Cloudflare 面板中查看实时日志）
      console.log('No KV (WAITLIST_KV) or D1 (DB) binding found. Received email:', email);
    }

    return new Response(JSON.stringify({ success: true, message: 'Added to waitlist' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
