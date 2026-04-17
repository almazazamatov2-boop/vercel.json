'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const PLANS = [
  { id: 'trial', name: 'Пробный', priceLabel: 'Бесплатно', duration: '7 дней', desc: 'Попробуйте все возможности перед покупкой', highlight: false },
  { id: 'month', name: 'Месяц', priceLabel: '990 ₽', duration: '30 дней', desc: 'Базовый доступ ко всем функциям LIVE замены', highlight: false },
  { id: 'half-year', name: '6 Месяцев', priceLabel: '4 900 ₽', duration: '180 дней', desc: 'Оптимальный выбор для активных стримеров', highlight: true },
  { id: 'year', name: 'Год', priceLabel: '7 900 ₽', duration: '365 дней', desc: 'Максимальная выгода и приоритетная поддержка', highlight: false },
]

export default function FaceSwapPage() {
  const [isLogged, setIsLogged] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    // Check auth status
    fetch('/api/auth_me')
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setIsLogged(true)
          setUser(data)
          // Simulate fetching subscription from Redis
          setSubscription({ plan: 'null', active: false })
        }
      })
  }, [])

  const handleAction = (plan: any) => {
    if (!isLogged) {
      window.location.href = '/api/auth/twitch'
      return
    }
    setSelectedPlan(plan)
    setShowCheckout(true)
  }

  const completePayment = () => {
    setSubscription({ plan: selectedPlan.id, active: true, until: '2026-05-25' })
    setShowCheckout(false)
    alert('Оплата успешно подтверждена! Подписка активирована.')
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-violet-500/30">
      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 p-10 rounded-[40px] max-w-md w-full space-y-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">ОПЛАТА ТАРИФА</h3>
              <button onClick={() => setShowCheckout(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl">
              <div className="text-sm text-white/40 uppercase font-bold mb-1">{selectedPlan.name}</div>
              <div className="text-3xl font-black">{selectedPlan.priceLabel}</div>
            </div>
            <div className="grid gap-4">
              <button onClick={completePayment} className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                <span className="font-bold">🖥️ SberPay / СБП</span>
                <span className="text-xs font-bold text-violet-400">FAST</span>
              </button>
              <button onClick={completePayment} className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
                <span className="font-bold">💎 CRYPTO (USDT/TON)</span>
                <span className="text-xs font-bold text-violet-400">ANON</span>
              </button>
            </div>
            <p className="text-[10px] text-center text-white/20 uppercase font-bold tracking-widest">Безопасная оплата через шлюз PARACETAMOL PAY</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="/faceswap" className="text-2xl font-black tracking-tighter uppercase italic">
            ФЕЙССВАП
          </a>
          <div className="hidden md:flex gap-8 text-sm font-medium text-white/60">
            <a href="#demo" className="hover:text-white transition-colors">Демонстрация</a>
            <a href="#pricing" className="hover:text-white transition-colors">Тарифы</a>
            <a href="#download" className="hover:text-white transition-colors">Загрузка</a>
          </div>
          {isLogged ? (
            <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.href='/profile'}>
               {subscription?.active && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/30">ACTIVE</span>}
              <span className="text-sm font-medium text-white/80">{user.display_name}</span>
              <img src={user.profile_image_url} className="w-8 h-8 rounded-full border border-white/10" alt="" />
            </div>
          ) : (
            <a href="/api/auth/twitch" className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">
              Войти через Twitch
            </a>
          )}
        </div>
      </nav>

      {/* Hero / Demo Section */}
      <section id="demo" className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-bold tracking-widest uppercase">
              Artificial Intelligence
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
              FACE <span className="text-violet-500">SWAP</span><br /> LIVE AI
            </h1>
            <p className="text-xl text-white/50 max-w-lg leading-relaxed">
              Заменяйте лицо в реальном времени. Без задержек, с сохранением мимики и эмоций. Идеально для контента и анонимности.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#pricing" className="px-8 py-4 rounded-2xl bg-violet-600 font-bold hover:bg-violet-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.4)] transition-all">
                Попробовать бесплатно
              </a>
              <button 
                onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all"
              >
                Смотреть демо
              </button>
            </div>
          </div>
          <div className="relative group" id="demo-video">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#111] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="/faceswap_demo_promo_1776459940065.png" 
                className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                alt="AI Face Swap Demo" 
              />
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold tracking-tight">System Status: Active</span>
                  <span className="text-violet-400 text-xs font-mono">LATENCY: 14MS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">ВЫБЕРИТЕ СВОЙ <span className="text-violet-500">ТАРИФ</span></h2>
          <p className="text-white/40 text-lg">7 дней пробного периода доступны каждому пользователю</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-8 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer flex flex-col ${
                plan.highlight 
                ? 'bg-violet-600/10 border-violet-500/50 shadow-[0_0_60px_rgba(124,58,237,0.15)]' 
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
              onClick={() => handleAction(plan)}
            >
              <div className="space-y-2 mb-8">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-3xl font-black">{plan.priceLabel}</div>
                <div className="text-sm text-white/40 font-medium">{plan.duration}</div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed mb-8 flex-grow">
                {plan.desc}
              </p>
              <button className={`w-full py-3 rounded-xl font-bold transition-all ${
                plan.highlight 
                ? 'bg-violet-600 text-white shadow-lg' 
                : 'bg-white text-black'
              }`}>
                {plan.id === 'trial' ? 'Активировать' : 'Купить'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Download Section (Visible only for subscribers or logged in as preview) */}
      <section id="download" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5 text-center">
        <div className="bg-white/5 border border-white/10 rounded-[40px] p-20 space-y-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative space-y-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">ГОТОВЫ НАЧАТЬ?</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Наш клиент автоматически скачает последние модели нейросетей и настроит ваше железо для максимальной производительности.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
              <a 
                href="/dist/launcher.exe" 
                download
                className="px-16 py-6 rounded-2xl bg-white text-black font-black hover:scale-105 transition-all flex items-center justify-center gap-3 no-underline shadow-[0_0_50px_rgba(255,255,255,0.2)]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                СКАЧАТЬ КЛИЕНТ (34MB)
              </a>
            </div>
            <div className="pt-12 text-xs font-bold text-white/20 tracking-widest uppercase">
              Supports Windows 10/11 • DIRECTX 12 REQUIRED • LESS THAN 1GB
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center px-6">
        <div className="text-sm font-medium text-white/20">
          © 2026 PARACETAMOLHAZE • SMART AI SOLUTIONS
        </div>
      </footer>
    </div>
  )
}
