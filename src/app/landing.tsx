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
    <div className="min-h-screen bg-landing-hero font-sans text-neutral-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-10 lg:px-12">
        <div className="relative border-b border-neutral-border pb-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-display text-sm font-bold uppercase tracking-[0.32em] text-teal-dark sm:text-base">
                LeadFlow
              </div>
              <div className="mt-1 hidden text-sm text-neutral sm:block">
                Atendimento e qualificação de leads para corretores autônomos.
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="rounded-full border border-neutral-border bg-white/80 px-4 py-2 text-xs font-medium text-neutral-steel shadow-sm backdrop-blur transition hover:bg-white"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-neutral-ink px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-deep"
              >
                Criar conta grátis
              </Link>
            </div>
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              variant="outline"
              size="sm"
              icon={menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              aria-label="Menu"
              className="sm:hidden"
            />
          </div>
          {menuOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col gap-2 rounded-2xl border border-neutral-border bg-white p-4 shadow-lg sm:hidden">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-neutral-border px-4 py-2.5 text-center text-sm font-medium text-neutral-steel transition hover:bg-neutral-surface"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-neutral-ink px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-neutral-deep"
              >
                Criar conta grátis
              </Link>
            </div>
          )}
        </div>
        <div className="grid flex-1 gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-teal-dark/15 bg-white/85 px-3 py-1.5 text-xs font-medium text-teal-deep shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
              Responda em segundos. Organize sem esforço. Priorize com clareza.
            </div>
            <div className="font-display mt-6 text-3xl font-semibold leading-[1.08] tracking-tight text-neutral-ink sm:mt-8 sm:text-5xl lg:text-6xl">
              Transforme o WhatsApp em um funil simples de vendas imobiliárias.
            </div>
            <div className="font-body mt-5 max-w-xl text-base leading-7 text-neutral sm:mt-6 sm:text-lg sm:leading-8 lg:text-xl">
              O LeadFlow atende o primeiro contato, coleta informações
              essenciais e entrega ao corretor apenas os leads com maior
              probabilidade de compra.
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-ink px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 sm:h-12"
                href="/register"
              >
                Começar agora — grátis
              </Link>
              <a
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-border bg-white/80 px-6 text-sm font-semibold text-neutral-dark shadow-sm backdrop-blur transition-colors hover:bg-white sm:h-12"
                href="#como-funciona"
              >
                Entender o fluxo
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-2 sm:mt-12 sm:gap-4">
              <div className="rounded-2xl border border-neutral-border bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:rounded-3xl sm:px-6 sm:py-5">
                <div className="text-[10px] text-neutral-muted sm:text-sm">
                  Resposta inicial
                </div>
                <div className="font-display mt-1.5 text-base font-semibold text-neutral-ink sm:mt-3 sm:text-3xl">
                  instantânea
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-border bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:rounded-3xl sm:px-6 sm:py-5">
                <div className="text-[10px] text-neutral-muted sm:text-sm">
                  Qualificação
                </div>
                <div className="font-display mt-1.5 text-base font-semibold text-neutral-ink sm:mt-3 sm:text-3xl">
                  automática
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-border bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:rounded-3xl sm:px-6 sm:py-5">
                <div className="text-[10px] text-neutral-muted sm:text-sm">
                  Operação
                </div>
                <div className="font-display mt-1.5 text-base font-semibold text-neutral-ink sm:mt-3 sm:text-3xl">
                  simples
                </div>
              </div>
            </div>
          </div>
          <div
            id="crm"
            className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-ink p-3 text-white shadow-hero sm:rounded-[2rem] sm:p-4"
          >
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-xl bg-white/6 p-3 sm:rounded-3xl sm:p-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-muted sm:text-xs">
                  Leads ativos
                </div>
                <div className="mt-2 flex items-center gap-2 sm:gap-3">
                  <div className="text-xl font-semibold sm:text-2xl">
                    18 contatos
                  </div>
                  <div className="shrink-0 whitespace-nowrap rounded-full bg-green-emerald/18 px-2 py-0.5 text-[10px] font-medium text-green-sage sm:px-3 sm:py-1 sm:text-xs">
                    5 quentes
                  </div>
                </div>
                <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                  {priorityLeads.map((lead) => (
                    <div
                      key={lead.name}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 sm:rounded-[1.25rem] sm:p-4"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold sm:text-base">
                          {lead.name}
                        </div>
                        <div className="shrink-0 whitespace-nowrap rounded-full bg-orange-amber/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-lemon sm:px-3 sm:py-1 sm:text-xs">
                          {lead.score}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-neutral-muted sm:text-sm">
                        {lead.stage}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-neutral-muted sm:mt-3 sm:text-sm sm:leading-6">
                        {lead.detail}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-neutral sm:mt-4 sm:text-xs">
                        <div>Próxima ação</div>
                        <div>{lead.eta}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-xl bg-white p-4 text-neutral-ink sm:rounded-3xl sm:p-5">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral sm:text-xs">
                      Conversa assistida
                    </div>
                    <div className="shrink-0 whitespace-nowrap rounded-full bg-teal-dark px-2 py-0.5 text-[10px] font-semibold text-white sm:px-3 sm:py-1 sm:text-xs">
                      Lead quente
                    </div>
                  </div>
                  <div className="font-display mt-2 text-xl font-semibold sm:text-2xl">
                    Mariana Souza
                  </div>
                  <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
                    {conversationFlow.map((entry, index) => {
                      const isAssistant = entry.role === "Assistente";
                      return (
                        <div
                          key={`${entry.role}-${index}`}
                          className={`max-w-[92%] rounded-xl px-3 py-2.5 text-xs leading-5 shadow-sm sm:rounded-[1.25rem] sm:px-4 sm:py-3 sm:text-sm sm:leading-6 ${
                            isAssistant
                              ? "bg-neutral-surface text-neutral-dark"
                              : "ml-auto bg-teal-dark text-white"
                          }`}
                        >
                          <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.24em] opacity-65 sm:text-[11px]">
                            {entry.role}
                          </div>
                          <div>{entry.message}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 rounded-xl border border-neutral-border bg-white px-3 py-3 sm:mt-5 sm:rounded-[1.25rem] sm:px-4 sm:py-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral sm:text-xs">
                      Perfil gerado pela IA
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                      <div className="rounded-xl bg-neutral-surface p-2.5 sm:rounded-2xl sm:p-3">
                        <div className="text-[10px] text-neutral-muted sm:text-xs">
                          Região
                        </div>
                        <div className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Zona Sul
                        </div>
                      </div>
                      <div className="rounded-xl bg-neutral-surface p-2.5 sm:rounded-2xl sm:p-3">
                        <div className="text-[10px] text-neutral-muted sm:text-xs">
                          Faixa
                        </div>
                        <div className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Até R$ 780 mil
                        </div>
                      </div>
                      <div className="rounded-xl bg-neutral-surface p-2.5 sm:rounded-2xl sm:p-3">
                        <div className="text-[10px] text-neutral-muted sm:text-xs">
                          Prazo
                        </div>
                        <div className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Até 60 dias
                        </div>
                      </div>
                      <div className="rounded-xl bg-neutral-surface p-2.5 sm:rounded-2xl sm:p-3">
                        <div className="text-[10px] text-neutral-muted sm:text-xs">
                          Próximo passo
                        </div>
                        <div className="mt-0.5 text-sm font-semibold sm:mt-1">
                          Agendar visita
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/6 p-3 sm:rounded-3xl sm:p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-muted sm:text-xs">
                      Follow-up
                    </div>
                    <div className="mt-1.5 text-xs font-medium text-white sm:mt-2 sm:text-sm">
                      Mensagens programadas para não perder leads frios.
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/6 p-3 sm:rounded-3xl sm:p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-muted sm:text-xs">
                      Organização
                    </div>
                    <div className="mt-1.5 text-xs font-medium text-white sm:mt-2 sm:text-sm">
                      Histórico centralizado para o corretor retomar a conversa
                      com contexto.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="como-funciona"
        className="border-y border-neutral-border bg-white/70 px-4 py-14 backdrop-blur sm:px-10 sm:py-20 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-yellow-gold sm:text-sm">
              Como funciona
            </div>
            <div className="font-display mt-4 text-2xl font-semibold tracking-tight text-neutral-ink sm:mt-5 sm:text-4xl">
              Um fluxo direto para responder, qualificar e entregar contexto.
            </div>
            <div className="font-body mt-4 text-base leading-7 text-neutral sm:mt-5 sm:text-lg sm:leading-8">
              O sistema não substitui o corretor. Ele organiza a entrada, faz a
              triagem inicial e cria clareza sobre quem precisa de atenção
              imediata.
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5 lg:grid-cols-3">
            {qualificationSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-neutral-border bg-neutral-surface p-5 shadow-sm sm:rounded-[1.75rem] sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-ink text-sm font-semibold text-white sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">
                  0{index + 1}
                </div>
                <div className="font-display mt-5 text-xl font-semibold text-neutral-ink sm:mt-6 sm:text-2xl">
                  {step.title}
                </div>
                <div className="font-body mt-3 text-sm leading-6 text-neutral sm:mt-4 sm:text-base sm:leading-7">
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 py-14 sm:px-10 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-neutral-border bg-neutral-ink p-6 text-white shadow-hero-soft sm:rounded-[2rem] sm:p-8">
            <div className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-green-mint sm:text-sm">
              O que o corretor ganha
            </div>
            <div className="font-display mt-4 text-2xl font-semibold tracking-tight sm:mt-5 sm:text-4xl">
              Menos perda de lead. Mais foco em quem realmente quer comprar.
            </div>
            <div className="font-body mt-4 text-base leading-7 text-neutral-muted sm:mt-5 sm:text-lg sm:leading-8">
              O valor do produto está na capacidade de aumentar a taxa de
              resposta e reduzir o abandono causado por demora, desorganização e
              ausência de follow-up.
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {systemHighlights.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-neutral-border bg-white p-5 shadow-sm sm:rounded-[1.75rem] sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-butter text-base text-yellow-dark sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
                  +
                </div>
                <div className="font-body mt-4 text-sm leading-6 text-neutral sm:mt-5 sm:text-lg sm:leading-7">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-border px-4 py-6 sm:px-10 sm:py-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-xs text-neutral-muted sm:text-sm">
            LeadFlow — WhatsApp + IA + CRM leve
          </div>
          <Link
            href="/register"
            className="rounded-full bg-neutral-ink px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-deep"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </div>
  );
}
