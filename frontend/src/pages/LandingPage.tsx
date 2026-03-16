import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-sky-600">Icebreaker</span>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">Demo v2</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm px-4 py-1.5">登录</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-1.5">免费注册</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-sky-50 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">精准触达，而非批量群发</h1>
          <p className="text-lg text-gray-600 mb-8">
            从单候选人到批量项目化管理，AI 根据每人简历生成个性化邮件<br />
            发前审批，发后追踪回复
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary px-6 py-2.5 text-base">开始体验</Link>
            <Link to="/login" className="btn-secondary px-6 py-2.5 text-base">直接登录</Link>
          </div>
        </div>
      </section>

      {/* v1 → Demo Comparison */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">相比 icebreaker.build 的全面升级</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* v1 card */}
            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">icebreaker.build v1</div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span>🧍</span><span>每次处理一个候选人</span></li>
                <li className="flex items-start gap-2"><span>📋</span><span>手动逐一填写信息</span></li>
                <li className="flex items-start gap-2"><span>✉️</span><span>生成即查看，手动复制</span></li>
              </ul>
            </div>
            {/* Demo v2 card */}
            <div className="border border-sky-200 rounded-xl p-6 bg-sky-50">
              <div className="text-sm font-semibold text-sky-600 mb-4 uppercase tracking-wide">Icebreaker Demo v2 ✨</div>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span>👥</span><span>Campaign 批量管理多候选人</span></li>
                <li className="flex items-start gap-2"><span>📂</span><span>CSV / Excel + 简历文件批量导入</span></li>
                <li className="flex items-start gap-2"><span>✅</span><span>生成 → 审批 → SMTP 一键发送</span></li>
                <li className="flex items-start gap-2"><span>📊</span><span>发送状态 & 候选人进度实时追踪</span></li>
                <li className="flex items-start gap-2"><span>👤</span><span>多 Sender Profile 管理</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* v3 New Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-10">
            <h2 className="text-2xl font-bold">最新迭代：精准触达三件套</h2>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">接触历史 + 冷却保护</h3>
              <p className="text-sm text-gray-600">
                自动检测 90 天内是否已联系该候选人。发送前显示 ⚠️ 警告，防止重复骚扰；可选择忽略冷却强制发送。
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold text-gray-900 mb-2">招聘者个人备注</h3>
              <p className="text-sm text-gray-600">
                为每位候选人添加私密观察（如"在 GopherCon 见过"），AI 自然融入邮件正文，提升真诚感。备注更新后一键重新生成。
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">回复追踪</h3>
              <p className="text-sm text-gray-600">
                标记候选人是否已回复，项目卡片显示 X/Y replied 回复率，闭合反馈循环，量化真实效果。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">所有能力一览</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🤖', title: 'AI 风格自动匹配', desc: '4 种风格：Professional / Warm / Concise / Storytelling' },
              { icon: '🌐', '6 种语言': true, title: '6 种语言', desc: '中文 / 英文 / 日语 / 韩语 / 德语 / 法语' },
              { icon: '📎', title: '简历 OCR 解析', desc: 'PDF / Word / 图片 一键提取候选人信息' },
              { icon: '📊', title: 'CSV / Excel 批量导入', desc: '一次上传，批量创建候选人档案' },
              { icon: '✏️', title: '发前审批 & 在线编辑', desc: '逐条检查、修改后再发送，确保邮件质量' },
              { icon: '🔄', title: '单封重新生成', desc: '一键换风格重新生成单封邮件，无需重跑全批' },
              { icon: '📬', title: 'SMTP 直接发送', desc: '支持自定义发件人，连接任意邮件服务商' },
              { icon: '🏷️', title: '多 Sender Profile', desc: '管理多个发件人身份，灵活切换发件方' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{f.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-sky-600 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">立即免费体验</h2>
        <p className="text-sky-100 mb-8">注册后 5 分钟即可跑完完整流程</p>
        <Link to="/register" className="bg-white text-sky-600 font-semibold px-8 py-3 rounded-lg hover:bg-sky-50 transition-colors">
          免费注册
        </Link>
      </section>

      {/* Page footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        Icebreaker Demo — Batch AI Recruitment Emails
      </footer>
    </div>
  );
}
