# 📖 Manual Completo do Sistema — Aplicativo Pedro Personal Trainer

Este documento é o guia definitivo, técnico e operacional do **Aplicativo Pedro**, desenvolvido sob medida para personal trainers que buscam agilidade extrema, confiabilidade de agendamento, gestão financeira sem atrito e prescrição inteligente de treinos.

---

## 📑 Sumário

1. [Visão Geral & Stack Tecnológica](#1-visão-geral--stack-tecnológica)
2. [Arquitetura & Segurança (OWASP)](#2-arquitetura--segurança-owasp)
3. [Módulos do Sistema](#3-módulos-do-sistema)
   - [3.1. Dashboard Principal (`/`)](#31-dashboard-principal-)
   - [3.2. Agenda Inteligente & Drag & Drop (`/agenda`)](#32-agenda-inteligente--drag--drop-agenda)
   - [3.3. Gestão de Alunos & Planos Flexíveis (`/alunos` e `/alunos/[id]`)](#33-gestão-de-alunos--planos-flexíveis-alunos-e-alunosid)
   - [3.4. Planos de Treino, Edição & Clonagem (`/planos` e `/planos/novo`)](#34-planos-de-treino-edição--clonagem-planos-e-planosnovo)
   - [3.5. Biblioteca de Exercícios & Modal Picker (`/exercicios`)](#35-biblioteca-de-exercícios--modal-picker-exercicios)
   - [3.6. Módulo Financeiro Minimalista (`/financeiro`)](#36-módulo-financeiro-minimalista-financeiro)
   - [3.7. Área do Aluno com Cronômetro de Treino (`/treino/[token]`)](#37-área-do-aluno-com-cronômetro-de-treino-treinotoken)
   - [3.8. Configurações & Paletas Esportivas (`/configuracoes`)](#38-configurações--paletas-esportivas-configuracoes)
4. [Design System & Usabilidade Mobile-First](#4-design-system--usabilidade-mobile-first)
5. [Fluxos de Trabalho Práticos do Personal (Passo a Passo)](#5-fluxos-de-trabalho-práticos-do-personal-passo-a-passo)
6. [Infraestrutura, Docker & Deploy em Nuvem](#6-infraestrutura-docker--deploy-em-nuvem)

---

## 1. Visão Geral & Stack Tecnológica

O sistema foi concebido para eliminar planilhas, anotações de papel e trocas confusas de mensagens de WhatsApp, centralizando a rotina do personal em uma aplicação web progressiva (PWA), ultraveloz e desenhada para telas de smartphone e computadores.

### Componentes Tecnológicos:
- **Framework Core**: [Next.js 14](https://nextjs.org/) (App Router, Server Components e API Routes).
- **Linguagem**: TypeScript com verificação estrita de tipos (`tsc --noEmit` com 0 erros).
- **Estilização**: Tailwind CSS com tema escuro esportivo e variáveis CSS para troca instantânea de paleta.
- **Ícones**: Lucide React Icons.
- **Manipulação de Datas**: `date-fns` (localizado em `pt-BR`).
- **Banco de Dados & ORM**: SQLite com [Prisma ORM](https://www.prisma.io/) (relacionamentos relacionais, índices para alta performance e migrações declarativas).
- **Gerenciamento de Cache Cliente**: Módulo próprio de Stale-While-Revalidate (`src/lib/cache.ts`) que proporciona navegação com **0ms de latência percebida**.
- **Controle de Concorrência**: `AsyncMutex` (`src/lib/mutex.ts`) com fila serializada para impedir disputas de horário no mesmo milissegundo (Race Condition).
- **Containerização**: Docker multi-etapas com Alpine Linux, otimizado para deploy em Railway, Render, Fly.io ou VPS própria.

---

## 2. Arquitetura & Segurança (OWASP)

A aplicação conta com blindagem completa de segurança baseada nas melhores práticas OWASP:

1. **Autenticação por PIN Mestre**:
   - PIN seguro do treinador armazenado com hash criptográfico seguro (BCrypt/SHA com salt).
   - Sessões web baseadas em cookies seguros HTTP-Only (`pedro_pt_session`).
2. **Proteção Contra Força Bruta (Rate Limiting)**:
   - Limitação automática de tentativas incorretas de PIN com bloqueio progressivo por IP.
3. **Middleware de Proteção Global (`src/middleware.ts`)**:
   - Bloqueio imediato de qualquer acesso não autenticado a rotas privadas da API (`/api/students`, `/api/classes`, `/api/workouts`, `/api/payments`, etc.).
   - Injeção obrigatória de cabeçalhos de segurança HTTP em todas as respostas:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `Referrer-Policy: strict-origin-when-cross-origin`
4. **Área Pública Isolada**:
   - O link de treino do aluno (`/treino/[token]` e `/api/public/workout/[token]`) é acessível publicamente via token UUID criptográfico único de 8 caracteres, sem expor dados financeiros ou outros alunos.

---

## 3. Módulos do Sistema

### 3.1. Dashboard Principal (`/`)

O **Dashboard** é a central de comando diária do personal:

- **Estatísticas do Mês**:
  - Aulas Realizadas vs Previstas.
  - Alunos Ativos no período.
  - Receita Recebida e Pendências em destaque com alertas coloridos.
- **Próxima Aula em Destaque (Hero Card)**:
  - Exibe com destaque qual o próximo aluno a ser atendido, horário de início, local e foco do treino.
  - Botão de ação rápida para alternar status (Marcar Concluída) e abrir conversa direta no WhatsApp.
- **Agenda de Hoje**:
  - Lista cronológica de todas as sessões marcadas para o dia atual.
- **Barra de Ações Rápidas**:
  - Botões de 1 clique para: *Novo Aluno*, *Agendar Aula*, *Montar Treino* e *Nova Cobrança*.

---

### 3.2. Agenda Inteligente & Drag & Drop (`/agenda`)

A Agenda é o coração operacional do aplicativo, desenhada para flexibilidade máxima:

#### 1. Navegação Multiview & Granularidade de Tempo:
- **Modos de Visualização**:
  - `Dia`: Visão detalhada da grade horária de 06:00 às 22:00.
  - `Semana`: Colunas por dia útil (Segunda a Domingo).
  - `Mês`: Visão panorâmica dos próximos 30 dias.
- **Seletor de Granularidade**:
  - `1h (Padrão Compacto)`: Visão limpa e verticalmente enxuta.
  - `30m`: Detalhamento intermediário.
  - `15m`: Máxima precisão para personal com horários fracionados.
- **Micro-Alvos de 15 Minutos (`:00`, `:15`, `:30`, `:45`)**:
  - Na visualização de 1 hora, cada bloco horário conta com 4 botões táteis das frações de 15 minutos, permitindo agendar ou mover aulas diretamente para horários como `07:15`, `08:45`, etc.

#### 2. Arraste e Solte (Drag & Drop) & Tap-to-Move Híbrido:
- **No Desktop**: Arraste qualquer card de aluno pelo grip lateral e solte no novo horário ou fração de minutos desejada.
- **No Mobile / Smartphone**: Toque no botão **`Mover`** ou segure o card por 300ms. O sistema ativa o banner de realocação no topo da tela; basta tocar no horário de destino para transferir a aula instantaneamente!

#### 3. Modo de Confirmação Imediato (De ➔ Para):
- Ao soltar ou tocar no novo horário, abre-se o modal de confirmação:
  - Exibe comparativo claro da data/hora original tachada e a nova proposta.
  - **Preservação Automática da Duração**: Se a aula original durava 45 minutos (ex: 07:15 às 08:00), ao mover para 09:30 o término é automaticamente calculado como 10:15.
  - Permite alterar local (Academia, Domicílio, Online, Parque) e incluir notas de reagendamento.

#### 4. Motor Anti-Choque & Treinos em Conjunto:
- **Validação com Precisão ao Minuto**: O sistema compara os intervalos exatos:
  $$\text{Choque} \iff (\text{start}_A < \text{end}_B) \land (\text{end}_A > \text{start}_B)$$
- **Alerta Explícito**: Avisa imediatamente no modal quem já está agendado e o horário conflitante.
- **Suporte Nativo a Sessões Compartilhadas (Duplas)**:
  - Checkbox opcional: `[X] Permitir Treino em Conjunto (Sessão Compartilhada / Dupla)`.
  - Na grade horária, sessões com mais de um aluno recebem o badge especial em tom índigo: `👥 Treino em Conjunto (2 alunos)`.

#### 5. Integração Inteligente com Fichas de Treino:
- Ao abrir o modal de Novo Agendamento e selecionar o aluno:
  - Se o aluno **possui treinos cadastrados**: são exibidos **chips rápidos de 1 toque** com o nome da ficha e a quantidade de exercícios (ex: `[ 🏋️ Treino A - Peito e Tríceps (5 ex.) ]`). Ao clicar, o título do agendamento é preenchido instantaneamente.
  - Se o aluno **não possui treinos**: o sistema oferece botões com sugestões rápidas (`[ Avaliação Física ]`, `[ Adaptação ]`, `[ Membros Inferiores ]`, etc.) e um seletor para copiar o título de treinos da biblioteca.

---

### 3.3. Gestão de Alunos & Planos Flexíveis (`/alunos` e `/alunos/[id]`)

O módulo de alunos oferece liberdade total para personal trainers que cobram mensalidade, por treino avulso ou vendem pacotes:

#### 1. Três Modelos de Cobrança:
1. **🗓️ Mensalidade com Frequência Semanal**:
   - Chips rápidos de frequência: `1x/sem`, `2x/sem`, `3x/sem`, `4x/sem`, `Diário` e `Consultoria`.
   - Definição do dia de vencimento (ex: todo dia 10) e valor mensal.
2. **⚡ Avulso / Por Treino**:
   - Ideal para alunos esporádicos ou atendimento sob demanda (ex: R$ 90,00 por sessão).
   - Momento do acerto: `Pré-treino` (antecipado) ou `Pós-treino` (após a realização da aula).
   - **Blindagem no Financeiro**: Alunos avulsos são ignorados na rotina de geração em massa de faturas mensais, impedindo cobranças indevidas.
3. **📦 Pacote de Aulas**:
   - Definição do total de aulas (ex: pacote de 10 aulas), valor por sessão e acompanhamento do saldo de aulas restantes.

#### 2. Perfil Completo do Aluno (`/alunos/[id]`):
- **Aba 1: Dados e Anamnese**: Dados de contato, data de nascimento, objetivo principal, modelo contratado e botão de edição.
- **Aba 2: Situação Financeira**: Histórico de cobranças, botão para copiar a chave PIX do personal, cobrança automática com mensagem personalizada no WhatsApp e botão de 1 toque para marcar como pago ou desfazer.
- **Aba 3: Agenda de Aulas**: Histórico de presenças e próximas sessões agendadas com botão direto para agendar nova aula.
- **Aba 4: Planos de Treino**: Todas as fichas montadas para o aluno com botões de **Editar**, **Copiar p/ Outro**, **Enviar via WhatsApp** e **Visualizar**.

---

### 3.4. Planos de Treino, Edição & Clonagem (`/planos` e `/planos/novo`)

Permite estruturar treinos técnicos completos sem perda de tempo:

#### 1. Criação Rápida de Treinos:
- Campos: Título do treino (ex: *Treino A - Dorsais e Bíceps*), Objetivo (ex: *Hipertrofia e força*), Instruções gerais e seleção do Aluno.
- Tabela de Exercícios:
  - Nome do exercício (digitação livre ou seleção em 1 clique na Biblioteca).
  - Séries (ex: `4`).
  - Repetições (ex: `10-12` ou `Até a falha`).
  - Carga (ex: `60kg` ou `Halteres 16kg`).
  - Descanso em segundos (ex: `60s`, `90s`, `120s`).
  - Observações técnicas (ex: *Pausa isométrica de 2 segundos na contração*).
- Reordenação e remoção dinâmica de exercícios.

#### 2. Edição de Treinos Existentes (`/planos/novo?edit=[id]`):
- Acessível pelo botão `[ ✏️ Editar ]` em qualquer card.
- Carrega todas as séries e cargas salvas.
- Exibe banner informativo âmbar confirmando o modo de edição.
- Ao salvar via `PUT /api/workouts/[id]`, **mantém intacto o token e link de acesso do aluno**, atualizando o treino dele em tempo real sem necessidade de reenviar links.

#### 3. Clonagem para Outro Aluno (`/planos/novo?cloneFrom=[id]`):
- Acessível pelo botão `[ 📋 Copiar p/ Outro ]`.
- Importa toda a estrutura de exercícios de uma ficha modelo (nomes, séries, repetições, descansos e observações).
- Deixa o campo **Aluno** limpo para vincular ao novo aluno.
- Permite ajustar cargas e repetições livremente antes de salvar como uma **nova ficha independente** (`POST /api/workouts`).

---

### 3.5. Biblioteca de Exercícios & Modal Picker (`/exercicios`)

Para evitar digitação repetitiva no celular:

- **Catálogo com Mais de 120 Exercícios**: Organizados pelas 10 categorias essenciais da musculação:
  1. Peito
  2. Costas
  3. Ombros
  4. Bíceps
  5. Tríceps
  6. Quadríceps
  7. Posteriores & Glúteos
  8. Panturrilhas
  9. Abdômen & Core
  10. Cardio & Funcional
- **Modal de Seleção Integrado (`ExercisePickerModal`)**:
  - No formulário de treino, ao lado do campo "Nome do Exercício", existe o botão **`Biblioteca`**.
  - Abre uma janela modal com filtro por categoria muscular e busca textual rápida.
  - Tocar no exercício preenche o campo instantaneamente.
- **Exercícios Customizados**: Permite ao personal cadastrar variações próprias de exercícios diretamente no catálogo.

---

### 3.6. Módulo Financeiro Minimalista (`/financeiro`)

Redesenhado para máxima eficiência e foco na primeira dobra da tela:

#### 1. Cockpit Minimalista de 3 KPIs Clicáveis:
- **Recebido (Verde Esmeralda)**: Total arrecadado no mês e % atingida da meta (`X% da meta de R$ Y`). Ao clicar, filtra instantaneamente os alunos com faturas quitadas.
- **A Receber (Âmbar/Neutro)**: Total previsto que ainda está no prazo. Ao clicar, filtra faturas em aberto no prazo.
- **Em Atraso (Rosa Alerta)**: Total vencido não pago com badge pulsante. Se não houver inadimplência, exibe o selo verde tranquilizador `Zero atrasos`. Ao clicar, filtra quem está atrasado para cobrança rápida.
- **Micro-Barra Luminosa de Meta (4px)**: Segmentada proporcionalmente entre recebido (verde), a vencer (âmbar) e em atraso (vermelho).

#### 2. Cobrança Humanizada no WhatsApp em 1 Clique:
- Ao lado de cada fatura pendente, há o botão **`Cobrar WhatsApp`**.
- Gera automaticamente a mensagem amigável no WhatsApp do aluno:
  > *"Olá Mariana! Segue a cobrança da sua mensalidade (MAR/2026) no valor de R$ 380,00. Vencimento: 10/03. Minha chave PIX é: pedro@personalfit.com. Assim que realizar o pagamento, me avise por aqui! Abraço!"*
- O texto se adapta automaticamente se o aluno for **Mensalista**, **Avulso** ou **Pacote**.

#### 3. Automação de Faturas:
- Botão **`Gerar Mês`**: cria as cobranças de todos os alunos ativos daquele mês de uma só vez, respeitando a data de vencimento de cada um e ignorando automaticamente alunos avulsos.

---

### 3.7. Área do Aluno com Cronômetro de Treino (`/treino/[token]`)

Interface que o aluno abre no próprio celular na academia pelo link enviado pelo WhatsApp:

- **Visual Esportivo & Responsivo**: Cores de alto contraste e tipografia grande para fácil visualização entre as séries.
- **Controle de Execução**: Checkbox para o aluno marcar as séries já concluídas.
- **Cronômetro de Descanso Regressivo (`RestTimer`)**:
  - Ao concluir uma série, o cronômetro do exercício é ativado (ex: 60s, 90s).
  - Mostra a contagem regressiva com barra circular de progresso.
  - Alerta sonoro e vibração tátil no celular quando o tempo de descanso termina.
- **Segurança**: Rota pública somente-leitura restrita ao plano específico, sem acesso ao painel do treinador.

---

### 3.8. Configurações & Paletas Esportivas (`/configuracoes`)

- **Perfil Profissional**: Nome de exibição, número de registro no CREF, telefone WhatsApp, chave PIX e biografia.
- **Segurança**: Alteração do PIN mestre de 4 dígitos.
- **Paletas Esportivas Dinâmicas (WCAG 2.1 AA)**:
  1. **🌿 Emerald Health**: Verde Esmeralda (`#10b981`) sobre Grafite (`#09090b`).
  2. **⚡ Cyber Athletic**: Ciano Elétrico (`#06b6d4`) sobre Slate (`#020617`).
  3. **🔥 Solar Volt**: Laranja Vulcânico (`#f97316`) sobre Preto Ônix (`#0c0a09`).

---

## 4. Design System & Usabilidade Mobile-First

### 🛡️ Arquitetura de Modais Anti-Corte:
Para solucionar o problema clássico de modais em celulares (onde o teclado virtual ou telas compactas cortam botões no topo ou na base):
- Todos os modais do sistema adotam a estrutura:
  ```html
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="max-h-[90vh] flex flex-col my-auto w-full max-w-lg bg-zinc-900 rounded-3xl">
      <!-- Cabeçalho Fixo (shrink-0) -->
      <div class="shrink-0 pb-3 border-b ...">...</div>
      <!-- Corpo com Rolagem Independente (overflow-y-auto flex-1) -->
      <form class="overflow-y-auto flex-1 pr-1 space-y-4">...</form>
      <!-- Rodapé com Botões Fixo (shrink-0) -->
      <div class="shrink-0 pt-3 border-t ...">...</div>
    </div>
  </div>
  ```
- Garante que botões de Cancelar, Confirmar e campos do topo estejam **sempre 100% visíveis** em qualquer smartphone.

---

## 5. Fluxos de Trabalho Práticos do Personal

### Fluxo 1: Cadastrando um Novo Aluno
1. No menu, clique em **Alunos** (`/alunos`) e depois em **Novo Aluno**.
2. Preencha Nome, WhatsApp e Objetivo.
3. Escolha o Modelo de Contratação:
   - Se mensal: selecione a frequência (ex: `3x/sem`), o valor e o dia de vencimento.
   - Se avulso: defina o valor por treino e se o pagamento é antes ou após a aula.
   - Se pacote: defina a quantidade de aulas contratadas.
4. Clique em **Salvar Aluno**.

### Fluxo 2: Montando e Enviando um Treino
1. Vá em **Planos** (`/planos`) ➔ **Montar Novo Treino**.
2. Selecione o aluno e dê um nome (ex: `Treino A - Peito e Tríceps`).
3. Adicione os exercícios digitando ou tocando no botão **`Biblioteca`** para selecionar do catálogo.
4. Defina séries, repetições, carga e tempo de descanso.
5. Clique em **Salvar Plano de Treino**.
6. No card do treino salvo, toque em **`Enviar`** ➔ o sistema abre a janela de compartilhamento para enviar o link direto no WhatsApp do aluno em 1 toque.

### Fluxo 3: Reutilizando um Treino Existente para Outro Aluno
1. Na lista de treinos (`/planos`), localize a ficha que deseja reaproveitar.
2. Clique no botão **`Copiar p/ Outro`**.
3. O sistema abre o formulário com todos os exercícios pré-carregados.
4. Selecione o novo aluno destinatário, ajuste as cargas se necessário (ex: diminuir ou aumentar o peso).
5. Clique em **Salvar Novo Treino**. Uma ficha nova e independente foi criada!

### Fluxo 4: Agendando Aulas com Fichas Integradas
1. Na **Agenda** (`/agenda`), clique em **Nova Aula**.
2. Selecione o aluno. O sistema busca automaticamente as fichas cadastradas dele.
3. Clique no chip rápido do treino desejado (ex: `[ 🏋️ Treino A - Peito e Tríceps ]`).
4. Selecione a data, horário e se deseja repetir semanalmente por 4, 8 ou 12 semanas.
5. Se houver outro aluno no mesmo horário, o alerta anti-choque avisará; se for uma aula em dupla intencional, marque `Permitir Treino em Conjunto`.
6. Clique em **Confirmar Agendamento**.

### Fluxo 5: Reorganizando a Agenda no Dia a Dia
1. No computador: arraste o card do aluno para outro horário ou fração de 15 minutos.
2. No celular: toque no botão **`Mover`** do aluno e depois toque no novo horário desejado.
3. O modal de confirmação exibirá o comparativo de horário e recalculará a duração automaticamente.
4. Confirme para salvar.

### Fluxo 6: Rotina Financeira Mensal
1. No início do mês, acesse **Financeiro** (`/financeiro`).
2. Clique em **`Gerar Mês`** ➔ faturas de todos os mensalistas são geradas em 1 segundo (avulsos não são faturados).
3. Monitore os KPIs clicáveis no topo: clique em **Em Atraso** para ver quem ainda não pagou.
4. Clique no botão **`Cobrar WhatsApp`** ao lado do aluno para disparar a cobrança amigável com a chave PIX.
5. Assim que o aluno fizer o PIX, toque em **`Marcar como Pago`**.

---

## 6. Infraestrutura, Docker & Deploy em Nuvem

### Repositório GitHub
- **URL**: `https://github.com/sdarduini-bot/Personal-App.git`
- **Branch Principal**: `main`

### Dockerfile de Produção
```dockerfile
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### Comandos Úteis de Manutenção:
| Operação | Comando |
| :--- | :--- |
| **Iniciar em Desenvolvimento** | `npm run dev` |
| **Verificação Estrita de Tipos** | `npx tsc --noEmit` |
| **Compilação de Produção Local** | `npm run build` |
| **Iniciar Produção Local** | `npm start` |
| **Sincronizar Banco com Prisma** | `npx prisma db push` |
| **Abrir Prisma Studio (Painel Visual)** | `npx prisma studio` |

---
*Manual gerado e atualizado em Setembro de 2026 para o projeto Aplicativo Pedro.*
