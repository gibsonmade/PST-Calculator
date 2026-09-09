import { PIPE_REFERENCE } from "../data/pipeReference.js";

export const DEFAULT_INPUTS = {
  pipeSizeInches: 16,
  velocityMps: "4",
  reprocessingCostPerBbl: "10",
  transmixMinutesPerEvent: "20",
  eventsPerMonth: "12",
  yieldLossImprovementPct: "30",
};

export function parseInputs(rawInputs) {
  const parsed = {
    pipeSizeInches: Number(rawInputs.pipeSizeInches),
    velocityMps: parseDecimal(rawInputs.velocityMps),
    reprocessingCostPerBbl: parseDecimal(rawInputs.reprocessingCostPerBbl),
    transmixMinutesPerEvent: parseDecimal(rawInputs.transmixMinutesPerEvent),
    eventsPerMonth: parseWholeNumber(rawInputs.eventsPerMonth),
    yieldLossImprovementPct: parseDecimal(rawInputs.yieldLossImprovementPct),
  };

  const errors = {};

  if (!PIPE_REFERENCE[parsed.pipeSizeInches]) {
    errors.pipeSizeInches = "Select a supported PST pipe size.";
  }

  validateNonNegative(parsed, rawInputs, errors, "velocityMps");
  validateNonNegative(parsed, rawInputs, errors, "reprocessingCostPerBbl");
  validateNonNegative(parsed, rawInputs, errors, "transmixMinutesPerEvent");
  validateNonNegative(parsed, rawInputs, errors, "eventsPerMonth");
  validateNonNegative(parsed, rawInputs, errors, "yieldLossImprovementPct");

  if (
    rawInputs.eventsPerMonth !== "" &&
    Number.isFinite(parsed.eventsPerMonth) &&
    !Number.isInteger(parsed.eventsPerMonth)
  ) {
    errors.eventsPerMonth = "Use a whole number of events.";
  }

  if (
    rawInputs.yieldLossImprovementPct !== "" &&
    Number.isFinite(parsed.yieldLossImprovementPct) &&
    parsed.yieldLossImprovementPct > 100
  ) {
    errors.yieldLossImprovementPct = "Use a percentage from 0 to 100.";
  }

  return {
    values: parsed,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function calculateTransmix(inputs) {
  const ref = PIPE_REFERENCE[inputs.pipeSizeInches];
  const improvementDecimal = inputs.yieldLossImprovementPct / 100;
  const flowBblPerMinute = Number(inputs.pipeSizeInches);
  const minutesReducedPerEvent =
    inputs.transmixMinutesPerEvent * improvementDecimal;
  const minutesReducedMonthly = minutesReducedPerEvent * inputs.eventsPerMonth;
  const minutesReducedAnnual = minutesReducedMonthly * 12;
  const bblReducedPerEvent = flowBblPerMinute * minutesReducedPerEvent;
  const bblReducedMonthly = bblReducedPerEvent * inputs.eventsPerMonth;
  const bblReducedAnnual = bblReducedMonthly * 12;
  const grossSavingsPerEvent =
    bblReducedPerEvent * inputs.reprocessingCostPerBbl;
  const grossSavingsMonthly = grossSavingsPerEvent * inputs.eventsPerMonth;
  const grossSavingsAnnual = grossSavingsMonthly * 12;
  const cmaaSCostMonthly = ref.cmaaSTwoYearMonthly;
  const cmaaSCostAnnual = cmaaSCostMonthly * 12;
  const netSavingsMonthly = grossSavingsMonthly - cmaaSCostMonthly;
  const netSavingsAnnual = netSavingsMonthly * 12;
  const roiRatio =
    cmaaSCostMonthly === 0 ? null : grossSavingsMonthly / cmaaSCostMonthly;
  const roiPercent = roiRatio === null ? null : roiRatio * 100;

  return {
    flowBblPerMinute,
    minutesReducedPerEvent,
    bblReducedPerEvent,
    grossSavingsPerEvent,
    minutesReducedMonthly,
    minutesReducedAnnual,
    bblReducedMonthly,
    bblReducedAnnual,
    grossSavingsMonthly,
    grossSavingsAnnual,
    cmaaSCostMonthly,
    cmaaSCostAnnual,
    netSavingsMonthly,
    netSavingsAnnual,
    roiRatio,
    roiPercent,
  };
}

function parseDecimal(value) {
  if (value === "") return NaN;
  return Number(value);
}

function parseWholeNumber(value) {
  if (value === "") return NaN;
  return Number(value);
}

function validateNonNegative(parsed, rawInputs, errors, key) {
  if (rawInputs[key] === "") {
    errors[key] = "Enter a value to complete the model.";
    return;
  }

  if (!Number.isFinite(parsed[key])) {
    errors[key] = "Enter a numeric value.";
    return;
  }

  if (parsed[key] < 0) {
    errors[key] = "Value must be zero or greater.";
  }
}
