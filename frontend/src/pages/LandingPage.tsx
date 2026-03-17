import { Link } from 'react-router-dom';
import { useT, LangToggle } from '../lib/i18n';

export function LandingPage() {
  const { t } = useT();
  const l = t.landing;

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
            <LangToggle />
            <Link to="/login" className="btn-secondary text-sm px-4 py-1.5">{t.common.login}</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-1.5">{l.registerBtn}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-sky-50 py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{l.hero}</h1>
          <p className="text-lg text-gray-600 mb-8 whitespace-pre-line">{l.subtitle}</p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary px-6 py-2.5 text-base">{l.ctaStart}</Link>
            <Link to="/login" className="btn-secondary px-6 py-2.5 text-base">{l.ctaLogin}</Link>
          </div>
        </div>
      </section>

      {/* v1 → Demo Comparison */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">{l.compareTitle}</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">{l.v1Label}</div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span>🧍</span><span>{l.v1Items[0]}</span></li>
                <li className="flex items-start gap-2"><span>📋</span><span>{l.v1Items[1]}</span></li>
                <li className="flex items-start gap-2"><span>✉️</span><span>{l.v1Items[2]}</span></li>
              </ul>
            </div>
            <div className="border border-sky-200 rounded-xl p-6 bg-sky-50">
              <div className="text-sm font-semibold text-sky-600 mb-4 uppercase tracking-wide">{l.v2Label}</div>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span>👥</span><span>{l.v2Items[0]}</span></li>
                <li className="flex items-start gap-2"><span>📂</span><span>{l.v2Items[1]}</span></li>
                <li className="flex items-start gap-2"><span>✅</span><span>{l.v2Items[2]}</span></li>
                <li className="flex items-start gap-2"><span>📊</span><span>{l.v2Items[3]}</span></li>
                <li className="flex items-start gap-2"><span>👤</span><span>{l.v2Items[4]}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* v3 New Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-10">
            <h2 className="text-2xl font-bold">{l.v3Title}</h2>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">{l.feature1Title}</h3>
              <p className="text-sm text-gray-600">{l.feature1Desc}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold text-gray-900 mb-2">{l.feature2Title}</h3>
              <p className="text-sm text-gray-600">{l.feature2Desc}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">{l.feature3Title}</h3>
              <p className="text-sm text-gray-600">{l.feature3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">{l.featuresTitle}</h2>
          <div className="grid grid-cols-2 gap-4">
            {l.allFeaturesItems.map((f) => (
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
        <h2 className="text-3xl font-bold text-white mb-3">{l.ctaFooterTitle}</h2>
        <p className="text-sky-100 mb-8">{l.ctaFooterSub}</p>
        <Link to="/register" className="bg-white text-sky-600 font-semibold px-8 py-3 rounded-lg hover:bg-sky-50 transition-colors">
          {l.registerBtn}
        </Link>
      </section>

      {/* Page footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        Icebreaker Demo — Batch AI Recruitment Emails
      </footer>
    </div>
  );
}
