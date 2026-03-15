"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const priorityLeads = [
  {
    name: "Mariana Souza",
    stage: "Pronta para visita",
    detail: "Busca apartamento de 2 quartos na Zona Sul até R$ 780 mil.",
    score: "92/100",
    eta: "Responder agora",
  },
  {
    name: "Paulo Henrique",
    stage: "Em qualificação",
    detail: "Quer casa em condomínio e pretende comprar em até 90 dias.",
    score: "81/100",
    eta: "Hoje, 14h",
  },
  {
    name: "Ana Beatriz",
    stage: "Follow-up automático",
    detail: "Parou de responder após pedir opções na Barra da Tijuca.",
    score: "63/100",
    eta: "Amanhã, 10h",
  },
];

const qualificationSteps = [
  {
    title: "Resposta imediata no WhatsApp",
    description:
      "Todo novo contato recebe uma resposta profissional em segundos, mesmo quando o corretor está em visita ou dirigindo.",
  },
  {
    title: "Conversa curta e objetiva",
    description:
      "O assistente faz poucas perguntas, mas captura o que importa: região, faixa de valor, prazo e intenção de compra.",
  },
  {
    title: "Entrega do lead pronto",
    description:
      "Quando o lead demonstra intenção real, o corretor assume a conversa com histórico, contexto e prioridade definidos.",
  },
];

const systemHighlights = [
  "Mini CRM com histórico completo de mensagens e ficha automática do lead.",
  "Classificação de interesse para destacar quem merece atendimento imediato.",
  "Follow-ups programados para leads frios ou que deixaram de responder.",
  "Interface simples para corretores autônomos que não querem aprender um CRM pesado.",
];

const conversationFlow = [
  {
    role: "Assistente",
    message:
      "Olá, aqui é da equipe LeadFlow. Vi que você tem interesse em um imóvel. Posso te ajudar com algumas opções.",
  },
  {
    role: "Cliente",
    message: "Estou procurando apartamento na Zona Oeste.",
  },
  {
    role: "Assistente",
    message:
      "Perfeito. Você busca para morar ou investir? E qual faixa de valor faz mais sentido hoje?",
  },
  {
    role: "Cliente",
    message: "Para morar. Até R$ 650 mil e quero comprar ainda este semestre.",
  },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(17,94,89,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_28%),linear-gradient(180deg,#f8f5ef_0%,#fffdf8_46%,#f5efe6_100%)] font-sans text-slate-900">
      {/* ── HERO ── */}
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-10 lg:px-12">
        {/* Header */}
        <header className="relative border-b border-slate-200 pb-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-display text-sm font-bold uppercase tracking-[0.32em] text-teal-700 sm:text-base">
                LeadFlow
              </p>
              <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                Atendimento e qualificação de leads para corretores autônomos.
              </p>
            </div>

            {/* Desktop nav */}
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:bg-white"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
              >
                Criar conta grátis
              </Link>
            </div>

            {/* Mobile hamburger */}
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              variant="outline"
              size="sm"
              icon={menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              aria-label="Menu"
              className="sm:hidden"
            />
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:hidden">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Criar conta grátis
              </Link>
            </div>
          )}
        </header>

        {/* Hero content */}
        <div className="grid flex-1 gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-teal-700/15 bg-white/85 px-3 py-1.5 text-xs font-medium text-teal-800 shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
              Responda em segundos. Organize sem esforço. Priorize com clareza.
            </div>

            <h1 className="font-display mt-6 text-3xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:mt-8 sm:text-5xl lg:text-6xl">
              Transforme o WhatsApp em um funil simples de vendas imobiliárias.
            </h1>

            <p className="font-body mt-5 max-w-xl text-base leading-7 text-slate-500 sm:mt-6 sm:text-lg sm:leading-8 lg:text-xl">
              O LeadFlow atende o primeiro contato, coleta informações
              essenciais e entrega ao corretor apenas os leads com maior
              probabilidade de compra.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 sm:h-12"
                href="/register"
              >
                Começar agora — grátis
              </Link>
              <a
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white sm:h-12"
                href="#como-funciona"
              >
                Entender o fluxo
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-2 sm:mt-12 sm:gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:rounded-3xl sm:px-6 sm:py-5">
                <p className="text-[10px] text-slate-400 sm:text-sm">
                  Resposta inicial
                </p>
                <p className="font-display mt-1.5 text-base font-semibold text-slate-900 sm:mt-3 sm:text-3xl">
                  instantânea
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:rounded-3xl sm:px-6 sm:py-5">
                <p className="text-[10px] text-slate-400 sm:text-sm">
                  Qualificação
                </p>
                <p className="font-display mt-1.5 text-base font-semibold text-slate-900 sm:mt-3 sm:text-3xl">
                  automática
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:rounded-3xl sm:px-6 sm:py-5">
                <p className="text-[10px] text-slate-400 sm:text-sm">
                  Operação
                </p>
                <p className="font-display mt-1.5 text-base font-semibold text-slate-900 sm:mt-3 sm:text-3xl">
                  simples
                </p>
              </div>
            </div>
          </div>

          {/* CRM Preview */}
          <div
            id="crm"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-3 text-white shadow-[0_32px_90px_rgba(41,37,36,0.22)] sm:rounded-[2rem] sm:p-4"
          >
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              {/* Left – Leads */}
              <div className="rounded-xl bg-white/6 p-3 sm:rounded-3xl sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 sm:text-xs">
                  Leads ativos
                </p>
                <div className="mt-2 flex items-center gap-2 sm:gap-3">
                  <p className="text-xl font-semibold sm:text-2xl">
                    18 contatos
                  </p>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-500/18 px-2 py-0.5 text-[10px] font-medium text-emerald-300 sm:px-3 sm:py-1 sm:text-xs">
                    5 quentes
                  </span>
                </div>

                <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                  {priorityLeads.map((lead) => (
                    <article
                      key={lead.name}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 sm:rounded-[1.25rem] sm:p-4"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold sm:text-base">
                          {lead.name}
                        </h2>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 sm:px-3 sm:py-1 sm:text-xs">
                          {lead.score}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        {lead.stage}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
                        {lead.detail}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 sm:mt-4 sm:text-xs">
                        <span>Próxima ação</span>
                        <span>{lead.eta}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Right – Conversation */}
              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-xl bg-white p-4 text-slate-900 sm:rounded-3xl sm:p-5">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-xs">
                      Conversa assistida
                    </p>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-semibold text-white sm:px-3 sm:py-1 sm:text-xs">
                      Lead quente
                    </span>
                  </div>
                  <h2 className="font-display mt-2 text-xl font-semibold sm:text-2xl">
                    Mariana Souza
                  </h2>

                  <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
                    {conversationFlow.map((entry, index) => {
                      const isAssistant = entry.role === "Assistente";
                      return (
                        <div
                          key={`${entry.role}-${index}`}
                          className={`max-w-[92%] rounded-xl px-3 py-2.5 text-xs leading-5 shadow-sm sm:rounded-[1.25rem] sm:px-4 sm:py-3 sm:text-sm sm:leading-6 ${
                            isAssistant
                              ? "bg-slate-50 text-slate-700"
                              : "ml-auto bg-teal-700 text-white"
                          }`}
                        >
                          <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.24em] opacity-65 sm:text-[11px]">
                            {entry.role}
                          </p>
                          <p>{entry.message}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:mt-5 sm:rounded-[1.25rem] sm:px-4 sm:py-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-xs">
                      Perfil gerado pela IA
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                      <div className="rounded-xl bg-slate-50 p-2.5 sm:rounded-2xl sm:p-3">
                        <p className="text-[10px] text-slate-400 sm:text-xs">
                          Região
                        </p>
                        <p className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Zona Sul
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5 sm:rounded-2xl sm:p-3">
                        <p className="text-[10px] text-slate-400 sm:text-xs">
                          Faixa
                        </p>
                        <p className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Até R$ 780 mil
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5 sm:rounded-2xl sm:p-3">
                        <p className="text-[10px] text-slate-400 sm:text-xs">
                          Prazo
                        </p>
                        <p className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Até 60 dias
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5 sm:rounded-2xl sm:p-3">
                        <p className="text-[10px] text-slate-400 sm:text-xs">
                          Próximo passo
                        </p>
                        <p className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Agendar visita
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/6 p-3 sm:rounded-3xl sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 sm:text-xs">
                      Follow-up
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-white sm:mt-2 sm:text-sm">
                      Mensagens programadas para não perder leads frios.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/6 p-3 sm:rounded-3xl sm:p-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 sm:text-xs">
                      Organização
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-white sm:mt-2 sm:text-sm">
                      Histórico centralizado para o corretor retomar a conversa
                      com contexto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section
        id="como-funciona"
        className="border-y border-slate-200 bg-white/70 px-4 py-14 backdrop-blur sm:px-10 sm:py-20 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-amber-600 sm:text-sm">
              Como funciona
            </p>
            <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-5 sm:text-4xl">
              Um fluxo direto para responder, qualificar e entregar contexto.
            </h2>
            <p className="font-body mt-4 text-base leading-7 text-slate-500 sm:mt-5 sm:text-lg sm:leading-8">
              O sistema não substitui o corretor. Ele organiza a entrada, faz a
              triagem inicial e cria clareza sobre quem precisa de atenção
              imediata.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5 lg:grid-cols-3">
            {qualificationSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:rounded-[1.75rem] sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">
                  0{index + 1}
                </div>
                <h3 className="font-display mt-5 text-xl font-semibold text-slate-900 sm:mt-6 sm:text-2xl">
                  {step.title}
                </h3>
                <p className="font-body mt-3 text-sm leading-6 text-slate-500 sm:mt-4 sm:text-base sm:leading-7">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ── */}
      <section className="px-4 py-14 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_24px_70px_rgba(41,37,36,0.18)] sm:rounded-[2rem] sm:p-8">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400 sm:text-sm">
              O que o corretor ganha
            </p>
            <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight sm:mt-5 sm:text-4xl">
              Menos perda de lead. Mais foco em quem realmente quer comprar.
            </h2>
            <p className="font-body mt-4 text-base leading-7 text-slate-400 sm:mt-5 sm:text-lg sm:leading-8">
              O valor do produto está na capacidade de aumentar a taxa de
              resposta e reduzir o abandono causado por demora, desorganização e
              ausência de follow-up.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {systemHighlights.map((item) => (
              <article
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[1.75rem] sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-base text-amber-700 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
                  +
                </div>
                <p className="font-body mt-4 text-sm leading-6 text-slate-500 sm:mt-5 sm:text-lg sm:leading-7">
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 px-4 py-6 sm:px-10 sm:py-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400 sm:text-sm">
            LeadFlow — WhatsApp + IA + CRM leve
          </p>
          <Link
            href="/register"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Começar grátis
          </Link>
        </div>
      </footer>
    </main>
  );
}
