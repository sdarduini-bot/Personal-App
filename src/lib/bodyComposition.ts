/**
 * Motor de Cálculos de Composição Corporal e Avaliação Antropométrica
 * Suporta protocolos Jackson & Pollock (7 e 3 dobras), Guedes (3 dobras),
 * Bioimpedância e Weltman (Obesos), além de Perimetria / Circunferências.
 */

export type ProtocolType = "POLLOCK_7" | "POLLOCK_3" | "GUEDES_3" | "BIOIMPEDANCE" | "WELTMAN";
export type GenderType = "MALE" | "FEMALE";

export interface AssessmentInput {
  protocol: ProtocolType;
  gender: GenderType;
  age: number; // anos
  weight: number; // kg
  height: number; // metros (ex: 1.60 ou 160 cm)
  targetBodyFat: number; // % (ex: 19.00)

  // Dobras cutâneas (mm)
  subscapular?: number | null;
  chest?: number | null;
  suprailiac?: number | null;
  thigh?: number | null;
  triceps?: number | null;
  midaxillary?: number | null;
  abdominal?: number | null;

  // Bioimpedância direta
  directBodyFat?: number | null;

  // Circunferências (cm)
  neck?: number | null;
  shoulders?: number | null;
  chestCirc?: number | null;
  waist?: number | null;
  abdomenCirc?: number | null;
  hip?: number | null;
  rightArmRelaxed?: number | null;
  leftArmRelaxed?: number | null;
  rightArmContracted?: number | null;
  leftArmContracted?: number | null;
  rightForearm?: number | null;
  leftForearm?: number | null;
  rightThigh?: number | null;
  leftThigh?: number | null;
  rightCalf?: number | null;
  leftCalf?: number | null;
}

export interface AssessmentResult {
  protocol: ProtocolType;
  bodyFatPercent: number; // % gordura atual
  fatMass: number; // kg massa gorda
  leanMass: number; // kg massa magra
  idealWeight: number; // kg peso ideal para a meta
  excessWeight: number; // kg de gordura a perder (se positivo) ou a ganhar (se negativo)
  targetBodyFat: number; // % gordura ideal / meta
  imc: number; // índice de massa corporal
  imcClassification: string;
  rcq?: number | null; // relação cintura-quadril
  rcqRisk?: string | null;
  sumFolds?: number | null; // soma das dobras utilizadas
  bodyDensity?: number | null; // densidade corporal calculada
}

/**
 * Converte densidade corporal (g/cm³) em percentual de gordura usando a fórmula de Siri (1961)
 */
export function siriEquation(density: number): number {
  if (!density || density <= 0) return 0;
  const bf = (4.95 / density - 4.5) * 100;
  return Math.min(Math.max(Number(bf.toFixed(2)), 3.0), 65.0);
}

/**
 * Classificação do IMC segundo a Organização Mundial da Saúde
 */
export function getImcClassification(imc: number): string {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25.0) return "Peso normal";
  if (imc < 30.0) return "Sobrepeso";
  if (imc < 35.0) return "Obesidade Grau I";
  if (imc < 40.0) return "Obesidade Grau II";
  return "Obesidade Grau III";
}

/**
 * Avalia o risco cardiovascular da Relação Cintura-Quadril (RCQ)
 */
export function getRcqRisk(rcq: number, gender: GenderType): string {
  if (gender === "MALE") {
    if (rcq < 0.9) return "Baixo risco";
    if (rcq <= 0.99) return "Risco moderado";
    return "Alto risco cardiovascular";
  } else {
    if (rcq < 0.8) return "Baixo risco";
    if (rcq <= 0.85) return "Risco moderado";
    return "Alto risco cardiovascular";
  }
}

/**
 * Calcula a idade em anos a partir de uma data de nascimento YYYY-MM-DD
 */
export function calculateAgeFromBirthDate(birthDateStr?: string | null): number {
  if (!birthDateStr) return 25; // default
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 25;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(age, 10);
}

/**
 * Motor principal de cálculo antropométrico
 */
export function calculateBodyComposition(input: AssessmentInput): AssessmentResult {
  const {
    protocol,
    gender = "MALE",
    age = 25,
    weight = 70,
    targetBodyFat = 15,
  } = input;

  // Normalizar altura para metros (se vier em cm como 170, converte para 1.70)
  let heightM = input.height || 1.7;
  if (heightM > 3.0) {
    heightM = heightM / 100;
  }
  heightM = Math.max(heightM, 0.5);

  const safeWeight = Math.max(weight, 10);
  const safeTargetBf = Math.min(Math.max(targetBodyFat, 3), 50);

  // IMC
  const imc = Number((safeWeight / (heightM * heightM)).toFixed(2));
  const imcClassification = getImcClassification(imc);

  // RCQ
  let rcq: number | null = null;
  let rcqRisk: string | null = null;
  if (input.waist && input.hip && input.hip > 0) {
    rcq = Number((input.waist / input.hip).toFixed(2));
    rcqRisk = getRcqRisk(rcq, gender);
  }

  let bodyFatPercent = 0;
  let bodyDensity: number | null = null;
  let sumFolds: number | null = null;

  const sub = input.subscapular || 0;
  const chest = input.chest || 0;
  const supra = input.suprailiac || 0;
  const thigh = input.thigh || 0;
  const triceps = input.triceps || 0;
  const axil = input.midaxillary || 0;
  const abd = input.abdominal || 0;

  switch (protocol) {
    case "POLLOCK_7": {
      // 7 dobras: Subescapular, Peitoral, Axilar média, Supra-ilíaca, Abdominal, Coxa, Tríceps
      sumFolds = Number((sub + chest + supra + thigh + triceps + axil + abd).toFixed(2));
      const s = sumFolds;

      if (gender === "MALE") {
        bodyDensity =
          1.112 -
          0.00043499 * s +
          0.00000055 * Math.pow(s, 2) -
          0.00028826 * age;
      } else {
        bodyDensity =
          1.097 -
          0.00046971 * s +
          0.00000056 * Math.pow(s, 2) -
          0.00012828 * age;
      }
      bodyFatPercent = siriEquation(bodyDensity);
      break;
    }

    case "POLLOCK_3": {
      // Homens: Peitoral, Abdômen, Coxa
      // Mulheres: Tríceps, Supra-ilíaca, Coxa
      if (gender === "MALE") {
        sumFolds = Number((chest + abd + thigh).toFixed(2));
        const s = sumFolds;
        bodyDensity =
          1.10938 -
          0.0008267 * s +
          0.0000016 * Math.pow(s, 2) -
          0.0002574 * age;
      } else {
        sumFolds = Number((triceps + supra + thigh).toFixed(2));
        const s = sumFolds;
        bodyDensity =
          1.0994921 -
          0.0009929 * s +
          0.0000023 * Math.pow(s, 2) -
          0.0001392 * age;
      }
      bodyFatPercent = siriEquation(bodyDensity);
      break;
    }

    case "GUEDES_3": {
      // Homens: Tríceps, Abdômen, Supra-ilíaca
      // Mulheres: Coxa, Supra-ilíaca, Subescapular
      if (gender === "MALE") {
        sumFolds = Number((triceps + abd + supra).toFixed(2));
        const s = Math.max(sumFolds, 1);
        bodyDensity = 1.17136 - 0.06706 * Math.log10(s);
      } else {
        sumFolds = Number((thigh + supra + sub).toFixed(2));
        const s = Math.max(sumFolds, 1);
        bodyDensity = 1.16687 - 0.07063 * Math.log10(s);
      }
      bodyFatPercent = siriEquation(bodyDensity);
      break;
    }

    case "BIOIMPEDANCE": {
      bodyFatPercent = Number((input.directBodyFat ?? 20).toFixed(2));
      break;
    }

    case "WELTMAN": {
      // Indicado para obesos. Utiliza Abdômen e Peso
      const abdCirc = input.abdomenCirc || input.waist || 80;
      if (gender === "MALE") {
        bodyFatPercent =
          0.31457 * abdCirc - 0.10969 * safeWeight + 10.8336;
      } else {
        const heightCm = heightM * 100;
        bodyFatPercent =
          0.11077 * abdCirc -
          0.17666 * heightCm +
          0.14354 * safeWeight +
          35.6;
      }
      bodyFatPercent = Math.min(Math.max(Number(bodyFatPercent.toFixed(2)), 3), 65);
      break;
    }

    default:
      bodyFatPercent = 20;
  }

  // Se por alguma razão o cálculo resultou em NaN
  if (isNaN(bodyFatPercent) || !isFinite(bodyFatPercent)) {
    bodyFatPercent = 20;
  }
  bodyFatPercent = Number(bodyFatPercent.toFixed(2));

  // Massas e Peso Ideal
  const fatMass = Number(((safeWeight * bodyFatPercent) / 100).toFixed(2));
  const leanMass = Number((safeWeight - fatMass).toFixed(2));

  // Peso Ideal baseado na meta de % de gordura (mantendo a massa magra atual intacta)
  const factor = 1 - safeTargetBf / 100;
  const idealWeight = factor > 0 ? Number((leanMass / factor).toFixed(2)) : safeWeight;
  const excessWeight = Number((safeWeight - idealWeight).toFixed(2));

  return {
    protocol,
    bodyFatPercent,
    fatMass,
    leanMass,
    idealWeight,
    excessWeight,
    targetBodyFat: safeTargetBf,
    imc,
    imcClassification,
    rcq,
    rcqRisk,
    sumFolds,
    bodyDensity: bodyDensity ? Number(bodyDensity.toFixed(4)) : null,
  };
}

export interface AssessmentSummaryData {
  bodyFatPercent: number;
  leanMass: number;
  fatMass: number;
  targetBodyFat: number;
  idealWeight: number;
  excessWeight: number;
}

/**
 * Gera mensagem formatada para WhatsApp com os resultados da avaliação
 */
export function buildAssessmentWhatsAppText(
  studentName: string,
  assessmentDate: string,
  result: AssessmentSummaryData,
  weight: number,
  previousResult?: AssessmentSummaryData | null,
  trainerName = "Pedro Personal"
): string {
  const dateFormatted = new Date(assessmentDate + "T12:00:00").toLocaleDateString("pt-BR");
  let msg = `📊 *AVALIAÇÃO DE COMPOSIÇÃO CORPORAL*\n`;
  msg += `👤 *Aluno(a):* ${studentName}\n`;
  msg += `📅 *Data:* ${dateFormatted}\n\n`;

  msg += `⚖️ *Peso Atual:* ${weight.toFixed(2)} kg\n`;
  msg += `🎯 *Gordura Atual:* ${result.bodyFatPercent.toFixed(2)}%\n`;
  msg += `💪 *Massa Magra:* ${result.leanMass.toFixed(2)} kg\n`;
  msg += `🧈 *Massa Gorda:* ${result.fatMass.toFixed(2)} kg\n`;
  msg += `🏁 *Meta de Gordura:* ${result.targetBodyFat.toFixed(2)}%\n`;
  msg += `🎯 *Peso Ideal p/ Meta:* ${result.idealWeight.toFixed(2)} kg\n`;

  if (result.excessWeight > 0) {
    msg += `📉 *Gordura a Eliminar:* ${result.excessWeight.toFixed(2)} kg\n`;
  } else if (result.excessWeight < 0) {
    msg += `📈 *Massa a Desenvolver:* ${Math.abs(result.excessWeight).toFixed(2)} kg\n`;
  }

  if (previousResult) {
    const diffBf = result.bodyFatPercent - previousResult.bodyFatPercent;
    const diffLean = result.leanMass - previousResult.leanMass;
    msg += `\n🔄 *EVOLUÇÃO DESDE A ÚLTIMA AVALIAÇÃO:*\n`;
    msg += `${diffBf <= 0 ? "🔥" : "⚠️"} *Gordura Corporal:* ${diffBf > 0 ? "+" : ""}${diffBf.toFixed(2)}%\n`;
    msg += `${diffLean >= 0 ? "💪" : "⚠️"} *Massa Magra:* ${diffLean > 0 ? "+" : ""}${diffLean.toFixed(2)} kg\n`;
  }

  msg += `\n_Parabéns pelo foco e dedicação aos treinos! Conte sempre comigo._ 🚀\n`;
  msg += `— *${trainerName}*`;

  return msg;
}
