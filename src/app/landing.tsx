import Link from "next/link";

const priorityLeads = [
  {
    name: "Mariana Souza",
    stage: "Pronta para visita",
    detail: "Busca apartamento de 2 quartos na Zona Sul ate R$ 780 mil.",
    score: "92/100",
    eta: "Responder agora",
  },
  {
    name: "Paulo Henrique",
    stage: "Em qualificacao",
    detail: "Quer casa em condominio e pretende comprar em ate 90 dias.",
    score: "81/100",
    eta: "Hoje, 14h",
  },
  {
    name: "Ana Beatriz",
    stage: "Follow-up automatico",
    detail: "Parou de responder apos pedir opcoes na Barra da Tijuca.",
    score: "63/100",
    eta: "Amanha, 10h",
  },
];

const qualificationSteps = [
  {
    title: "Resposta imediata no WhatsApp",
    description:
      "Todo novo contato recebe uma resposta profissional em segundos, mesmo quando o corretor esta em visita ou dirigindo.",
  },
  {
    title: "Conversa curta e objetiva",
    description:
      "O assistente faz poucas perguntas, mas captura o que importa: regiao, faixa de valor, prazo e intencao de compra.",
  },
  {
    title: "Entrega do lead pronto",
    description:
      "Quando o lead demonstra intencao real, o corretor assume a conversa com historico, contexto e prioridade definidos.",
  },
];

const systemHighlights = [
  "Mini CRM com historico completo de mensagens e ficha automatica do lead.",
  "Classificacao de interesse para destacar quem merece atendimento imediato.",
  "Follow-ups programados para leads frios ou que deixaram de responder.",
  "Interface simples para corretores autonomos que nao querem aprender um CRM pesado.",
];

const conversationFlow = [
  {
    role: "Assistente",
    message:
      "Ola, aqui e da equipe LeadFlow. Vi que voce tem interesse em um imovel. Posso te ajudar com algumas opcoes.",
  },
  {
    role: "Cliente",
    message: "Estou procurando apartamento na Zona Oeste.",
  },
  {
    role: "Assistente",
    message:
      "Perfeito. Voce busca para morar ou investir? E qual faixa de valor faz mais sentido hoje?",
  },
  {
    role: "Cliente",
    message: "Para morar. Ate R$ 650 mil e quero comprar ainda este semestre.",
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(17,94,89,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(180deg,_#f8f5ef_0%,_#fffdf8_46%,_#f5efe6_100%)] font-sans text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-700">
              LeadFlow
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Atendimento e qualificacao de leads para corretores autonomos.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              Criar conta gratis
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-teal-700/15 bg-white/85 px-4 py-2 text-sm font-medium text-teal-800 shadow-sm backdrop-blur">
              Responda em segundos. Organize sem esforco. Priorize com clareza.
            </div>

            <h1 className="mt-8 text-5xl font-semibold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl">
              Transforme o WhatsApp em um funil simples de vendas imobiliarias.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500 sm:text-xl">
              O LeadFlow atende o primeiro contato, coleta informacoes
              essenciais e entrega ao corretor apenas os leads com maior
              probabilidade de compra.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                href="/register"
              >
                Comecar agora — gratis
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
                href="#como-funciona"
              >
                Entender o fluxo
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-sm text-slate-400">Resposta inicial</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  instantanea
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-sm text-slate-400">Qualificacao</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  automatica
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-sm text-slate-400">Operacao</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  simples
                </p>
              </div>
            </div>
          </div>

          <div
            id="crm"
            className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900 p-4 text-white shadow-[0_32px_90px_rgba(41,37,36,0.22)]"
          >
            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[1.5rem] bg-white/6 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Leads ativos
                    </p>
                    <p className="mt-2 text-2xl font-semibold">18 contatos</p>
                  </div>
                  <div className="rounded-full bg-emerald-500/18 px-3 py-1 text-xs font-medium text-emerald-300">
                    5 quentes
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {priorityLeads.map((lead) => (
                    <article
                      key={lead.name}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold">{lead.name}</h2>
                          <p className="mt-1 text-sm text-slate-400">
                            {lead.stage}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                          {lead.score}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {lead.detail}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>Proxima acao</span>
                        <span>{lead.eta}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] bg-white p-5 text-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Conversa assistida
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        Mariana Souza
                      </h2>
                    </div>
                    <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold text-white">
                      Lead quente
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {conversationFlow.map((entry, index) => {
                      const isAssistant = entry.role === "Assistente";
                      return (
                        <div
                          key={`${entry.role}-${index}`}
                          className={`max-w-[90%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                            isAssistant
                              ? "bg-slate-50 text-slate-700"
                              : "ml-auto bg-teal-700 text-white"
                          }`}
                        >
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] opacity-65">
                            {entry.role}
                          </p>
                          <p>{entry.message}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Perfil gerado pela IA
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Regiao</p>
                        <p className="mt-1 font-semibold">Zona Sul</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Faixa</p>
                        <p className="mt-1 font-semibold">Ate R$ 780 mil</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Prazo</p>
                        <p className="mt-1 font-semibold">Ate 60 dias</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Proximo passo</p>
                        <p className="mt-1 font-semibold">Agendar visita</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Follow-up
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                      Mensagens programadas para nao perder leads frios.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Organizacao
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                      Historico centralizado para o corretor retomar a conversa
                      com contexto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y border-slate-200 bg-white/70 px-6 py-20 backdrop-blur sm:px-10 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-600">
              Como funciona
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">
              Um fluxo direto para responder, qualificar e entregar contexto.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-500">
              O sistema nao substitui o corretor. Ele organiza a entrada, faz a
              triagem inicial e cria clareza sobre quem precisa de atencao
              imediata.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {qualificationSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                  0{index + 1}
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-500">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-8 text-white shadow-[0_24px_70px_rgba(41,37,36,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
              O que o corretor ganha
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight">
              Menos perda de lead. Mais foco em quem realmente quer comprar.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              O valor do produto esta na capacidade de aumentar a taxa de
              resposta e reduzir o abandono causado por demora, desorganizacao e
              ausencia de follow-up.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {systemHighlights.map((item) => (
              <article
                key={item}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-lg text-amber-700">
                  +
                </div>
                <p className="mt-5 text-lg leading-7 text-slate-500">
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 sm:px-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-sm text-slate-400">LeadFlow — WhatsApp + IA + CRM leve</p>
          <Link
            href="/register"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Comecar gratis
          </Link>
        </div>
      </footer>
    </main>
  );
}
