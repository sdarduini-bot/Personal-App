import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Limpar tabelas existentes
  await prisma.workoutExercise.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.trainerSettings.deleteMany();

  // 1. Configurações do Personal
  await prisma.trainerSettings.create({
    data: {
      id: "trainer",
      name: "Pedro Personal Trainer",
      pin: "1234",
      phone: "(11) 98765-4321",
      pixKey: "pedro@personalfit.com",
      bio: "Personal Trainer certificado CREF 123456-G/SP. Especialista em hipertrofia, emagrecimento e biomecânica do movimento.",
      themePreference: "dark",
    },
  });

  // 2. Alunos
  const mariana = await prisma.student.create({
    data: {
      name: "Mariana Lima",
      phone: "11998877665",
      email: "mariana.lima@exemplo.com",
      birthDate: "1996-04-12",
      goal: "Hipertrofia e Definição",
      planName: "Presencial VIP 3x/sem",
      monthlyFee: 380.0,
      dueDay: 10,
      startDate: "2026-02-01",
      status: "ACTIVE",
      notes: "Histórico de condromalácia patelar grau 1 no joelho esquerdo. Evitar flexão profunda sem aquecimento prévio.",
    },
  });

  const carlos = await prisma.student.create({
    data: {
      name: "Carlos Eduardo Santos",
      phone: "11987651234",
      email: "cadu.santos@exemplo.com",
      birthDate: "1988-11-23",
      goal: "Emagrecimento e Condicionamento",
      planName: "Presencial 4x/sem",
      monthlyFee: 450.0,
      dueDay: 15,
      startDate: "2026-01-15",
      status: "ACTIVE",
      notes: "Objetivo de perder 8kg e melhorar capacidade cardiorrespiratória para exames de rotina.",
    },
  });

  const beatriz = await prisma.student.create({
    data: {
      name: "Beatriz Silveira",
      phone: "11976549876",
      email: "bia.silveira@exemplo.com",
      birthDate: "2001-08-05",
      goal: "Fortalecimento e Correção Postural",
      planName: "Atendimento Domiciliar",
      monthlyFee: 420.0,
      dueDay: 20,
      startDate: "2026-05-10",
      status: "ACTIVE",
      notes: "Trabalha o dia todo sentada em home office. Muita queixa de tensão nos ombros e lombar.",
    },
  });

  const rodrigo = await prisma.student.create({
    data: {
      name: "Rodrigo Santana",
      phone: "11965431234",
      email: "rodrigo.santana@exemplo.com",
      birthDate: "1992-03-30",
      goal: "Condicionamento para Corrida",
      planName: "Consultoria Híbrida",
      monthlyFee: 350.0,
      dueDay: 5,
      startDate: "2026-03-01",
      status: "ACTIVE",
      notes: "Treinando para Meia Maratona no final do ano. Foco em fortalecimento excêntrico e prevenção de lesões.",
    },
  });

  const juliana = await prisma.student.create({
    data: {
      name: "Juliana Costa",
      phone: "11954327890",
      email: "ju.costa@exemplo.com",
      birthDate: "1994-07-19",
      goal: "Hipertrofia Geral",
      planName: "Presencial 3x/sem",
      monthlyFee: 400.0,
      dueDay: 10,
      startDate: "2026-04-01",
      status: "ACTIVE",
      notes: "Excelente disciplina e assiduidade. Foco atual no treino superior e dorsais.",
    },
  });

  const lucas = await prisma.student.create({
    data: {
      name: "Lucas Ramos",
      phone: "11943216543",
      email: "lucas.ramos@exemplo.com",
      birthDate: "1990-12-14",
      goal: "Saúde e Mobilidade",
      planName: "Presencial 2x/sem",
      monthlyFee: 300.0,
      dueDay: 25,
      startDate: "2026-06-01",
      status: "ACTIVE",
      notes: "Iniciante na musculação. Priorizar aprendizado motor e consciência corporal.",
    },
  });

  // 3. Pagamentos de Setembro de 2026
  await prisma.payment.createMany({
    data: [
      {
        studentId: mariana.id,
        amount: 380.0,
        referenceMonth: "09/2026",
        dueDate: "2026-09-10",
        paidAt: "2026-09-09",
        status: "PAID",
        paymentMethod: "PIX",
        notes: "Comprovante enviado pelo WhatsApp",
      },
      {
        studentId: rodrigo.id,
        amount: 350.0,
        referenceMonth: "09/2026",
        dueDate: "2026-09-05",
        paidAt: "2026-09-04",
        status: "PAID",
        paymentMethod: "PIX",
        notes: "Transferência automática programada",
      },
      {
        studentId: carlos.id,
        amount: 450.0,
        referenceMonth: "09/2026",
        dueDate: "2026-09-15",
        status: "OVERDUE",
        paymentMethod: "PIX",
        notes: "Atrasado há 4 dias. Lembrar aluno na aula de hoje.",
      },
      {
        studentId: juliana.id,
        amount: 400.0,
        referenceMonth: "09/2026",
        dueDate: "2026-09-10",
        status: "OVERDUE",
        paymentMethod: "PIX",
        notes: "Atrasado há 9 dias. Mensagem de cobrança pendente.",
      },
      {
        studentId: beatriz.id,
        amount: 420.0,
        referenceMonth: "09/2026",
        dueDate: "2026-09-20",
        status: "PENDING",
        paymentMethod: "PIX",
        notes: "Vence amanhã",
      },
      {
        studentId: lucas.id,
        amount: 300.0,
        referenceMonth: "09/2026",
        dueDate: "2026-09-25",
        status: "PENDING",
        paymentMethod: "PIX",
        notes: "Vence no final do mês",
      },
    ],
  });

  // 4. Aulas Agendadas (com foco no dia atual: 2026-09-19)
  const todayStr = "2026-09-19";

  await prisma.classSchedule.createMany({
    data: [
      {
        studentId: carlos.id,
        title: "Treino Metabólico e Cardio",
        date: todayStr,
        startTime: "07:00",
        endTime: "08:00",
        location: "ACADEMIA",
        status: "COMPLETED",
        notes: "Aluno completou todas as séries com ótima energia.",
      },
      {
        studentId: mariana.id,
        title: "Treino Inferiores A (Glúteo/Coxa)",
        date: todayStr,
        startTime: "09:30",
        endTime: "10:30",
        location: "ACADEMIA",
        status: "SCHEDULED",
        notes: "Subir 2kg na elevação pélvica se sentir confortável.",
      },
      {
        studentId: beatriz.id,
        title: "Mobilidade e Core em Domicílio",
        date: todayStr,
        startTime: "11:00",
        endTime: "12:00",
        location: "DOMICILIO",
        status: "SCHEDULED",
        notes: "Levar elásticos circulares e colchonete extra.",
      },
      {
        studentId: rodrigo.id,
        title: "Força Explosiva e Pliometria",
        date: todayStr,
        startTime: "15:00",
        endTime: "16:00",
        location: "ONLINE",
        status: "SCHEDULED",
        notes: "Aula ao vivo via Google Meet.",
      },
      // Dias anteriores e seguintes
      {
        studentId: juliana.id,
        title: "Dorsais e Deltoides",
        date: "2026-09-21",
        startTime: "08:00",
        endTime: "09:00",
        location: "ACADEMIA",
        status: "SCHEDULED",
        notes: "Foco no controle escapular na puxada alta.",
      },
      {
        studentId: lucas.id,
        title: "Treino Funcional de Adaptação",
        date: "2026-09-21",
        startTime: "18:00",
        endTime: "19:00",
        location: "ACADEMIA",
        status: "SCHEDULED",
        notes: "Avaliação da postura no agachamento taça.",
      },
    ],
  });

  // 5. Planos de Treino com Exercícios detalhados
  const planoMariana = await prisma.workoutPlan.create({
    data: {
      studentId: mariana.id,
      shareToken: "treino-mariana-gluteo-a",
      title: "Treino A - Ênfase Glúteos e Quadríceps",
      goal: "Hipertrofia com máxima ativação de cadeia posterior e glúteo máximo",
      notes: "Aquecer 5 min na esteira + mobilidade de quadril e tornozelo antes de iniciar.",
      exercises: {
        create: [
          {
            order: 1,
            name: "Elevação Pélvica com Barra",
            sets: "4",
            reps: "10-12",
            load: "70kg",
            restSeconds: 90,
            notes: "Pausa de 2 segundos no topo de cada repetição. Pés alinhados na largura do quadril.",
          },
          {
            order: 2,
            name: "Agachamento Búlgaro",
            sets: "3",
            reps: "10 cada lado",
            load: "Halteres de 12kg",
            restSeconds: 60,
            notes: "Tronco levemente inclinado para frente para focar no glúteo da perna da frente.",
          },
          {
            order: 3,
            name: "Cadeira Extensora",
            sets: "3",
            reps: "12-15",
            load: "45kg",
            restSeconds: 60,
            notes: "Cadência lenta na fase excêntrica (3 segundos descendo).",
          },
          {
            order: 4,
            name: "Stiff com Barra ou Halteres",
            sets: "4",
            reps: "10",
            load: "20kg halter",
            restSeconds: 75,
            notes: "Manter coluna neutra, focar no alongamento dos posteriores de coxa.",
          },
          {
            order: 5,
            name: "Cadeira Abdutora (Tronco Inclinado)",
            sets: "3",
            reps: "15 + 5 parciais",
            load: "50kg",
            restSeconds: 45,
            notes: "Inclinar o tronco à frente para recrutar glúteo médio e mínimo.",
          },
        ],
      },
    },
  });

  const planoCarlos = await prisma.workoutPlan.create({
    data: {
      studentId: carlos.id,
      shareToken: "treino-carlos-fullbody-metabolico",
      title: "Treino Metabólico e Queima Calórica",
      goal: "Alta densidade de treino para aceleração do metabolismo e gasto energético",
      notes: "Beber água moderadamente durante as pausas. Respeitar o tempo estrito de descanso.",
      exercises: {
        create: [
          {
            order: 1,
            name: "Kettlebell Swing",
            sets: "4",
            reps: "15",
            load: "16kg",
            restSeconds: 45,
            notes: "Impulsão potente do quadril, coluna reta.",
          },
          {
            order: 2,
            name: "Supino Reto com Halteres",
            sets: "4",
            reps: "10-12",
            load: "18kg halter",
            restSeconds: 60,
            notes: "Controle da descida e explosão na subida.",
          },
          {
            order: 3,
            name: "Remada Curvada com Barra",
            sets: "4",
            reps: "12",
            load: "35kg",
            restSeconds: 60,
            notes: "Puxar a barra em direção ao umbigo mantendo o abdômen travado.",
          },
          {
            order: 4,
            name: "Leg Press 45º",
            sets: "3",
            reps: "15",
            load: "120kg",
            restSeconds: 60,
            notes: "Amplitude segura sem retroversão de pelve.",
          },
          {
            order: 5,
            name: "Prancha Abdominal Isométrica",
            sets: "3",
            reps: "45 segundos",
            load: "Peso corporal",
            restSeconds: 45,
            notes: "Ativação total de glúteos e transverso do abdômen.",
          },
        ],
      },
    },
  });

  console.log("Seed concluído com sucesso!");
  console.log(`- Alunos criados: 6`);
  console.log(`- Planos de treino criados: 2 (${planoMariana.id}, ${planoCarlos.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
