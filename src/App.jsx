import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_INPUTS,
  calculateTransmix,
  parseInputs,
} from "./lib/calculations.js";
import {
  PIPE_REFERENCE,
  PIPE_SIZES,
  PURCHASE_PRICING_REFERENCE,
} from "./data/pipeReference.js";
import {
  formatCurrency,
  formatFlexible,
  formatNumber,
  formatPercent,
  formatRoiPercent,
} from "./lib/formatters.js";

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [resultsUpdateCount, setResultsUpdateCount] = useState(0);
  const [summaryIsUpdating, setSummaryIsUpdating] = useState(false);
  const updateTimerRef = useRef(null);
  const parsed = useMemo(() => parseInputs(inputs), [inputs]);
  const result = useMemo(
    () => (parsed.isValid ? calculateTransmix(parsed.values) : null),
    [parsed]
  );

  function updateInput(key, value) {
    setInputs((current) => ({ ...current, [key]: value }));
    setSummaryIsUpdating(true);
    window.clearTimeout(updateTimerRef.current);
    updateTimerRef.current = window.setTimeout(() => {
      setSummaryIsUpdating(false);
    }, 900);
  }

  useEffect(() => {
    return () => window.clearTimeout(updateTimerRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfcfb] text-[#071b34]">
      <CalculatorHeader />
      <main>
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
          <CalculatorIntro />
          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
            <CalculatorForm
              calculatorInputs={inputs}
              calculatorErrors={parsed.errors}
              onCalculatorChange={updateInput}
              onUpdateResults={() =>
                setResultsUpdateCount((current) => current + 1)
              }
              resultsUpdateCount={resultsUpdateCount}
            />
            <ImpactSummary isUpdating={summaryIsUpdating} result={result} />
          </div>
        </section>

        <CalculationWalkthrough inputs={parsed.values} result={result} />
        <FullBreakdown result={result} />
        <ReferenceDataTable selectedPipe={parsed.values.pipeSizeInches} />
      </main>
    </div>
  );
}

function CalculatorHeader() {
  return (
    <header className="border-b border-[#d7e0e7] bg-white/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-10">
        <img
          src="/assets/brand/pst-logo-grey.png"
          alt="Perceptive Sensor Technologies"
          className="h-18 w-auto object-contain"
        />
        <div className="text-right">
          <p className="text-sm font-semibold tracking-[0.14em] text-[#0a315d]">
            Transmix ROI Calculator
          </p>
        </div>
      </div>
    </header>
  );
}

function CalculatorIntro() {
  return (
    <div>
      <h1 className="text-4xl font-semibold leading-[1.05] tracking-normal text-balance sm:text-5xl lg:text-6xl">
        Transmix-ID ROI Calculator
      </h1>
      <p className="mt-5 text-lg leading-8 text-[#526275] text-pretty">
        This is the input and summary the user would see on the website. Check
        the inputs "About your operation" are desired and outputs "Projected
        Annual Net Savings" work properly.
      </p>
    </div>
  );
}

function CalculatorForm({
  calculatorInputs,
  calculatorErrors,
  onCalculatorChange,
  onUpdateResults,
  resultsUpdateCount,
}) {
  return (
    <section
      className="rounded-2xl border border-[#cfdae2] bg-white p-5 shadow-[0_18px_50px_rgba(7,27,52,0.06)] sm:p-6"
      aria-labelledby="operation-inputs"
    >
      <div>
        <h2 id="operation-inputs" className="text-2xl font-semibold">
          About your operation
        </h2>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <PipeSizeSelect
          value={calculatorInputs.pipeSizeInches}
          error={calculatorErrors.pipeSizeInches}
          onChange={(value) => onCalculatorChange("pipeSizeInches", value)}
        />
        <NumericField
          id="velocityMps"
          label="Average Velocity of Flow"
          unit="m/s"
          value={calculatorInputs.velocityMps}
          error={calculatorErrors.velocityMps}
          step="0.1"
          onChange={(value) => onCalculatorChange("velocityMps", value)}
        />
        <div className="md:col-span-2">
          <NumericField
            id="reprocessingCostPerBbl"
            label="Average Reprocessing Cost per Barrel of Transmix"
            unit="$/BBL"
            value={calculatorInputs.reprocessingCostPerBbl}
            error={calculatorErrors.reprocessingCostPerBbl}
            step="0.01"
            onChange={(value) =>
              onCalculatorChange("reprocessingCostPerBbl", value)
            }
          />
        </div>
        <div className="md:col-span-2">
          <NumericField
            id="transmixMinutesPerEvent"
            label="Average Length of Transmix Processing per Event"
            unit="minutes"
            value={calculatorInputs.transmixMinutesPerEvent}
            error={calculatorErrors.transmixMinutesPerEvent}
            step="0.1"
            onChange={(value) =>
              onCalculatorChange("transmixMinutesPerEvent", value)
            }
          />
        </div>
        <div className="md:col-span-2">
          <NumericField
            id="eventsPerMonth"
            label="Average Number of Transmix Events per Month"
            unit="events"
            value={calculatorInputs.eventsPerMonth}
            error={calculatorErrors.eventsPerMonth}
            step="1"
            inputMode="numeric"
            onChange={(value) => onCalculatorChange("eventsPerMonth", value)}
          />
        </div>
        <div className="md:col-span-2">
          <NumericField
            id="yieldLossImprovementPct"
            label="Projected Transmix Yield Loss Improvement"
            unit="%"
            value={calculatorInputs.yieldLossImprovementPct}
            error={calculatorErrors.yieldLossImprovementPct}
            step="0.1"
            min="0"
            max="100"
            onChange={(value) =>
              onCalculatorChange("yieldLossImprovementPct", value)
            }
          />
        </div>
      </div>

      <div className="mt-7">
        <button
          type="button"
          onClick={onUpdateResults}
          className="min-h-12 w-full rounded-xl bg-[#0a315d] px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(7,27,52,0.14)] transition-transform active:scale-[0.96] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#0a70b8] sm:w-auto"
        >
          Update results
        </button>
        <p className="mt-3 text-sm leading-6 text-[#526275]" aria-live="polite">
          {resultsUpdateCount > 0 ? "Results updated." : ""}
        </p>
      </div>
    </section>
  );
}

function PipeSizeSelect({ value, error, onChange }) {
  const descriptionId = "pipeSizeInches-description";
  const errorId = "pipeSizeInches-error";
  return (
    <div>
      <label htmlFor="pipeSizeInches" className="field-label">
        Average Pipe Size
      </label>
      <div className="mt-2 flex min-h-12 overflow-hidden rounded-xl border border-[#bac8d3] bg-white focus-within:border-[#0a70b8] focus-within:ring-4 focus-within:ring-[#0a70b8]/15">
        <select
          id="pipeSizeInches"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
          className="min-h-12 flex-1 bg-transparent px-3 text-base font-medium text-[#071b34] outline-none"
        >
          {PIPE_SIZES.map((pipe) => (
            <option key={pipe} value={pipe}>
              {pipe}"
            </option>
          ))}
        </select>
        <span className="flex min-w-20 items-center justify-center border-l border-[#d5dee6] bg-[#f4f7f8] px-3 text-sm font-semibold text-[#526275]">
          inches
        </span>
      </div>
      <span id={descriptionId} className="sr-only">
        Supported PST pipe sizes.
      </span>
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function NumericField({
  id,
  label,
  unit,
  value,
  error,
  step,
  min = "0",
  max,
  inputMode = "decimal",
  description,
  onChange,
}) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  return (
    <div className={description ? "mt-4" : ""}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="mt-2 flex min-h-12 overflow-hidden rounded-xl border border-[#bac8d3] bg-white focus-within:border-[#0a70b8] focus-within:ring-4 focus-within:ring-[#0a70b8]/15">
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          inputMode={inputMode}
          aria-invalid={Boolean(error)}
          aria-describedby={`${description ? descriptionId : ""}${
            error ? ` ${errorId}` : ""
          }`.trim()}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-base font-medium text-[#071b34] tabular-nums outline-none"
        />
        <span className="flex min-w-20 items-center justify-center border-l border-[#d5dee6] bg-[#f4f7f8] px-3 text-sm font-semibold text-[#526275]">
          {unit}
        </span>
      </div>
      {description && (
        <p id={descriptionId} className="field-description">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function ImpactSummary({ isUpdating, result }) {
  if (!result) {
    return (
      <section className="rounded-2xl border border-[#cfdae2] bg-[#f7faf9] p-6">
        <h2 className="text-2xl font-semibold">Projected impact</h2>
        <p className="mt-4 text-[#526275]">
          Complete the highlighted fields to see the live impact model.
        </p>
      </section>
    );
  }

  const unfavorable = result.netSavingsAnnual < 0;

  return (
    <section
      className="rounded-2xl border border-[#cfdae2] bg-[#f7faf9] p-5 text-center sm:p-6 lg:sticky lg:top-6"
      aria-labelledby="projected-impact"
    >
      <h2 id="projected-impact" className="text-2xl font-semibold">
        Projected Annual Net Savings
      </h2>
      <LoadingValue
        isLoading={isUpdating}
        skeletonClassName="mx-auto mt-7 h-[3rem] w-56 sm:h-[3.75rem] sm:w-72 lg:h-[4.5rem]"
      >
        <p
          className={`mt-7 text-5xl font-semibold leading-none tabular-nums sm:text-6xl lg:text-7xl ${
            unfavorable ? "text-[#8a4e1d]" : "text-[#071b34]"
          }`}
        >
          {formatCurrency(result.netSavingsAnnual)}
        </p>
      </LoadingValue>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric
          label="Projected Monthly Net Savings"
          value={formatCurrency(result.netSavingsMonthly)}
          unfavorable={result.netSavingsMonthly < 0}
          isLoading={isUpdating}
        />
        <Metric
          label="Annual Transmix Reduction"
          value={`${formatNumber(result.bblReducedAnnual, 0)} BBL`}
          isLoading={isUpdating}
        />
        <Metric
          label="Projected ROI"
          value={formatRoiPercent(result.roiPercent)}
          isLoading={isUpdating}
        />
      </div>

      <ComparisonRows isLoading={isUpdating} result={result} />
    </section>
  );
}

function LoadingValue({ isLoading, skeletonClassName, children }) {
  if (isLoading) {
    return (
      <div
        className={`block rounded-xl bg-[#dce7ed] summary-skeleton ${skeletonClassName}`}
        aria-hidden="true"
      />
    );
  }

  return children;
}

function Metric({ label, value, unfavorable = false, isLoading = false }) {
  return (
    <div className="border-t border-[#d6e0e7] pt-4 text-center">
      <LoadingValue
        isLoading={isLoading}
        skeletonClassName="mx-auto h-8 w-24"
      >
        <p
          className={`text-2xl font-semibold tabular-nums ${
            unfavorable ? "text-[#8a4e1d]" : "text-[#0a315d]"
          }`}
        >
          {value}
        </p>
      </LoadingValue>
      <p className="mt-2 text-sm leading-5 text-[#526275]">{label}</p>
    </div>
  );
}

function ComparisonRows({ isLoading = false, result }) {
  const rows = [
    [
      "Projected Terminal Transmix Savings",
      result.grossSavingsMonthly,
      result.grossSavingsAnnual,
    ],
    ["CMaaS Costs", result.cmaaSCostMonthly, result.cmaaSCostAnnual],
    ["Projected Savings", result.netSavingsMonthly, result.netSavingsAnnual],
    [
      "Projected Yield Loss Improvement in BBL",
      result.bblReducedMonthly,
      result.bblReducedAnnual,
    ],
  ];

  return (
    <div className="mt-9 overflow-hidden rounded-xl border border-[#d2dde5] bg-white">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-[#d2dde5] bg-[#eef4f5] px-4 py-3 text-xs font-bold tracking-[0.14em] text-[#526275]">
        <span>IMPACT</span>
        <span className="text-right">MONTHLY</span>
        <span className="text-right">ANNUAL</span>
      </div>
      {rows.map(([label, monthly, annual]) => (
        <div
          key={label}
          className="grid grid-cols-[1.1fr_1fr_1fr] gap-3 border-b border-[#edf2f4] px-4 py-3 transition-colors duration-150 hover:bg-[#f4faf8] last:border-b-0"
        >
          <span className="text-sm font-medium text-[#526275]">{label}</span>
          <div className="text-right font-semibold tabular-nums">
            <LoadingValue
              isLoading={isLoading}
              skeletonClassName="ml-auto h-5 w-20"
            >
              <span>
                {label === "Projected Yield Loss Improvement in BBL"
                  ? formatNumber(monthly, 0)
                  : formatCurrency(monthly)}
              </span>
            </LoadingValue>
          </div>
          <div className="text-right font-semibold tabular-nums">
            <LoadingValue
              isLoading={isLoading}
              skeletonClassName="ml-auto h-5 w-24"
            >
              <span>
                {label === "Projected Yield Loss Improvement in BBL"
                  ? formatNumber(annual, 0)
                  : formatCurrency(annual)}
              </span>
            </LoadingValue>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalculationWalkthrough({ inputs, result }) {
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    if (!selectedStep) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setSelectedStep(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStep]);

  if (!result) return null;

  const steps = [
    {
      title: "Pipe Selection",
      formula: `${inputs.pipeSizeInches}" pipe`,
      value: `Calculated Fluid Volume: ${formatNumber(result.flowBblPerMinute, 1)} BBL/min`,
      detail:
        "The Summary worksheet uses selected pipe size as calculated fluid volume in BBL per minute.",
      rows: [
        ["Selected pipe size", `${inputs.pipeSizeInches}"`],
        ["Calculation", `Number(${inputs.pipeSizeInches})`],
        ["Result", `${formatNumber(result.flowBblPerMinute, 1)} BBL/min`],
      ],
    },
    {
      title: "Yield Loss Time Reduction",
      formula: `${formatFlexible(inputs.transmixMinutesPerEvent, 2)} min x ${formatPercent(
        inputs.yieldLossImprovementPct
      )}`,
      value: `${formatFlexible(result.minutesReducedPerEvent, 2)} min reduced/event`,
      detail:
        "Projected minutes reduced per event are calculated from processing time and PST's yield-loss improvement assumption.",
      rows: [
        [
          "Transmix processing time",
          `${formatFlexible(inputs.transmixMinutesPerEvent, 2)} min/event`,
        ],
        ["Yield-loss improvement", formatPercent(inputs.yieldLossImprovementPct)],
        [
          "Calculation",
          `${formatFlexible(inputs.transmixMinutesPerEvent, 2)} x ${formatPercent(
            inputs.yieldLossImprovementPct
          )}`,
        ],
        ["Result", `${formatFlexible(result.minutesReducedPerEvent, 2)} min/event`],
      ],
    },
    {
      title: "Transmix Volume Reduction",
      formula: `${formatNumber(result.flowBblPerMinute, 2)} x ${formatFlexible(
        result.minutesReducedPerEvent,
        2
      )}`,
      value: `${formatNumber(result.bblReducedPerEvent, 2)} BBL/event`,
      detail:
        "Per-event barrel reduction multiplies calculated fluid volume by minutes saved per event.",
      rows: [
        ["Calculated fluid volume", `${formatNumber(result.flowBblPerMinute, 2)} BBL/min`],
        ["Minutes saved", `${formatFlexible(result.minutesReducedPerEvent, 2)} min`],
        [
          "Calculation",
          `${formatNumber(result.flowBblPerMinute, 2)} x ${formatFlexible(
            result.minutesReducedPerEvent,
            2
          )}`,
        ],
        ["Result", `${formatNumber(result.bblReducedPerEvent, 2)} BBL/event`],
      ],
    },
    {
      title: "Savings per Event",
      formula: `${formatNumber(result.bblReducedPerEvent, 2)} x ${formatCurrency(
        inputs.reprocessingCostPerBbl,
        { cents: true }
      )}`,
      value: `${formatCurrency(result.grossSavingsPerEvent)}/event`,
      detail:
        "Projected terminal transmix savings per event are barrel reduction multiplied by average reprocessing cost.",
      rows: [
        ["BBL reduced per event", `${formatNumber(result.bblReducedPerEvent, 2)} BBL`],
        [
          "Reprocessing cost",
          `${formatCurrency(inputs.reprocessingCostPerBbl, { cents: true })}/BBL`,
        ],
        [
          "Calculation",
          `${formatNumber(result.bblReducedPerEvent, 2)} x ${formatCurrency(
            inputs.reprocessingCostPerBbl,
            { cents: true }
          )}`,
        ],
        ["Result", `${formatCurrency(result.grossSavingsPerEvent)}/event`],
      ],
    },
    {
      title: "Monthly Gross Savings",
      formula: `${formatCurrency(result.grossSavingsPerEvent)} x ${formatNumber(
        inputs.eventsPerMonth
      )} events`,
      value: `${formatCurrency(result.grossSavingsMonthly)}/month`,
      detail:
        "Monthly gross savings multiply projected savings per event by average transmix events per month.",
      rows: [
        ["Savings per event", formatCurrency(result.grossSavingsPerEvent)],
        ["Events per month", formatNumber(inputs.eventsPerMonth, 0)],
        [
          "Calculation",
          `${formatCurrency(result.grossSavingsPerEvent)} x ${formatNumber(
            inputs.eventsPerMonth,
            0
          )}`,
        ],
        ["Result", `${formatCurrency(result.grossSavingsMonthly)}/month`],
      ],
    },
    {
      title: "CMaaS Cost",
      formula: `${inputs.pipeSizeInches}" pipe reference`,
      value: `${formatCurrency(result.cmaaSCostMonthly, { cents: true })}/month`,
      detail:
        "Monthly CMaaS cost comes from the PST 2-year CMaaS pricing table for the selected pipe size.",
      rows: [
        ["Selected pipe size", `${inputs.pipeSizeInches}"`],
        ["Reference value", `${formatCurrency(result.cmaaSCostMonthly, { cents: true })}/month`],
        ["Annualized value", `${formatCurrency(result.cmaaSCostAnnual, { cents: true })}/year`],
      ],
    },
    {
      title: "Projected Monthly Savings",
      formula: `${formatCurrency(result.grossSavingsMonthly)} - ${formatCurrency(
        result.cmaaSCostMonthly,
        { cents: true }
      )}`,
      value: `${formatCurrency(result.netSavingsMonthly)}/month`,
      detail:
        "Projected monthly savings subtract monthly CMaaS cost from monthly gross savings.",
      rows: [
        ["Monthly gross savings", formatCurrency(result.grossSavingsMonthly)],
        ["Monthly CMaaS cost", formatCurrency(result.cmaaSCostMonthly, { cents: true })],
        [
          "Calculation",
          `${formatCurrency(result.grossSavingsMonthly)} - ${formatCurrency(
            result.cmaaSCostMonthly,
            { cents: true }
          )}`,
        ],
        ["Result", `${formatCurrency(result.netSavingsMonthly)}/month`],
      ],
    },
    {
      title: "ROI",
      formula: `${formatCurrency(result.grossSavingsMonthly)} / ${formatCurrency(
        result.cmaaSCostMonthly,
        { cents: true }
      )}`,
      value: `${formatNumber(result.roiPercent, 2)}% ~= ${formatRoiPercent(
        result.roiPercent
      )}`,
      detail:
        "Projected ROI follows the client worksheet: gross savings divided by CMaaS cost, displayed as a percentage.",
      rows: [
        ["Monthly gross savings", formatCurrency(result.grossSavingsMonthly)],
        ["Monthly CMaaS cost", formatCurrency(result.cmaaSCostMonthly, { cents: true })],
        [
          "Calculation",
          `${formatCurrency(result.grossSavingsMonthly)} / ${formatCurrency(
            result.cmaaSCostMonthly,
            { cents: true }
          )}`,
        ],
        ["Precise result", `${formatNumber(result.roiPercent, 2)}%`],
        ["Displayed result", formatRoiPercent(result.roiPercent)],
      ],
    },
    {
      title: "Annual Projection",
      formula: "Monthly values x 12",
      value: `${formatCurrency(result.netSavingsAnnual)}/year`,
      detail:
        "Annual values are produced by multiplying monthly Summary worksheet outputs by 12.",
      rows: [
        ["Monthly projected savings", formatCurrency(result.netSavingsMonthly)],
        ["Calculation", `${formatCurrency(result.netSavingsMonthly)} x 12`],
        ["Annual projected savings", `${formatCurrency(result.netSavingsAnnual)}/year`],
      ],
    },
  ];

  return (
    <section className="border-y border-[#d7e0e7] bg-white py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
          Calculations & Data
        </h1>
        <p className="mt-5 text-lg leading-8 text-[#526275] text-pretty">
          Users will NOT see this information on the website. This information
          is to illustrate how the above Net Savings Summary is calculated.
        </p>
        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step) => (
            <CalculationStep
              key={step.title}
              step={step}
              onOpen={() => setSelectedStep(step)}
            />
          ))}
        </div>
      </div>
      <CalculationDrawer
        step={selectedStep}
        onClose={() => setSelectedStep(null)}
      />
    </section>
  );
}

function CalculationStep({ step, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative min-h-40 cursor-pointer rounded-xl border border-[#d6e0e7] bg-[#fbfcfb] p-4 text-left transition-[border-color,background-color,transform] duration-150 hover:border-[#93b5c9] hover:bg-white active:scale-[0.96]"
    >
      <h3 className="text-base font-semibold">{step.title}</h3>
      <p className="mt-3 min-h-10 text-sm leading-5 text-[#526275] tabular-nums">
        {step.formula}
      </p>
      <p className="mt-4 border-t border-[#dbe5ea] pt-3 text-lg font-semibold tabular-nums text-[#0a315d]">
        {step.value}
      </p>
    </button>
  );
}

function CalculationDrawer({ step, onClose }) {
  useEffect(() => {
    if (!step) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [step]);

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#071b34]/30"
      role="presentation"
      onMouseDown={onClose}
    >
      <aside
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-[0_24px_80px_rgba(7,27,52,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculation-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[#d7e0e7] px-6 py-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2
                id="calculation-drawer-title"
                className="text-2xl font-semibold text-[#071b34]"
              >
                {step.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close calculation detail"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-[#cbd8e1] px-3 text-2xl font-light leading-none text-[#0a315d] transition-[border-color,background-color,transform] duration-150 hover:border-[#93b5c9] hover:bg-[#f4f7f8] active:scale-[0.96]"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <p className="text-sm leading-7 text-[#526275]">{step.detail}</p>

          <div className="mt-7 rounded-xl border border-[#d6e0e7] bg-[#fbfcfb] p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#667789]">
              CURRENT FORMULA
            </p>
            <p className="mt-3 text-lg font-semibold leading-7 text-[#071b34] tabular-nums">
              {step.formula}
            </p>
            <p className="mt-4 border-t border-[#dbe5ea] pt-4 text-2xl font-semibold text-[#0a315d] tabular-nums">
              {step.value}
            </p>
          </div>

          <dl className="mt-7">
            {step.rows.map(([label, value]) => (
              <div
                key={`${label}-${value}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-5 border-b border-[#edf2f4] py-4 transition-colors duration-150 hover:bg-[#f4faf8]"
              >
                <dt className="text-sm leading-6 text-[#526275]">{label}</dt>
                <dd className="text-right text-sm font-semibold leading-6 text-[#071b34] tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}

function FullBreakdown({ result }) {
  if (!result) return null;
  const operational = [
    ["Calculated Fluid Volume", `${formatNumber(result.flowBblPerMinute, 1)} BBL/min`],
    [
      "Projected Reduction in Yield Loss in Minutes/Event",
      `${formatFlexible(result.minutesReducedPerEvent, 1)} minutes`,
    ],
    [
      "Projected Reduction in Yield Loss in Minutes/Month",
      `${formatFlexible(result.minutesReducedMonthly, 0)} minutes`,
    ],
    [
      "Projected Reduction in Yield Loss in Minutes/Year",
      `${formatFlexible(result.minutesReducedAnnual, 0)} minutes`,
    ],
    ["Projected Yield Loss Improvement in BBL/Event", `${formatNumber(result.bblReducedPerEvent, 0)} BBL`],
    ["Projected Yield Loss Improvement in BBL/Month", `${formatNumber(result.bblReducedMonthly, 0)} BBL`],
    ["Projected Yield Loss Improvement in BBL/Year", `${formatNumber(result.bblReducedAnnual, 0)} BBL`],
  ];
  const financial = [
    ["Projected Terminal Transmix Savings/Event", `${formatCurrency(result.grossSavingsPerEvent)}`],
    ["Projected Terminal Transmix Savings/Month", `${formatCurrency(result.grossSavingsMonthly)}`],
    ["Projected Terminal Transmix Savings/Year", `${formatCurrency(result.grossSavingsAnnual)}`],
    ["CMaaS Costs/Month", `${formatCurrency(result.cmaaSCostMonthly)}`],
    ["CMaaS Costs/Year", `${formatCurrency(result.cmaaSCostAnnual)}`],
    ["Projected Savings/Month", `${formatCurrency(result.netSavingsMonthly)}`],
    ["Projected Savings/Year", `${formatCurrency(result.netSavingsAnnual)}`],
    [
      "Projected ROI",
      formatRoiPercent(result.roiPercent),
    ],
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
      <h2 className="text-3xl font-semibold">Spreadsheet result detail</h2>
      <ResultMatrix result={result} />
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <BreakdownList title="Operational Impact" rows={operational} />
        <BreakdownList title="Financial Impact" rows={financial} />
      </div>
    </section>
  );
}

function ResultMatrix({ result }) {
  const rows = [
    [
      "Yield Loss Reduction - Minutes",
      formatNumber(result.minutesReducedPerEvent, 1),
      formatFlexible(result.minutesReducedMonthly, 0),
      formatFlexible(result.minutesReducedAnnual, 0),
    ],
    [
      "Yield Loss Improvement - BBL",
      formatNumber(result.bblReducedPerEvent, 0),
      formatNumber(result.bblReducedMonthly, 0),
      formatNumber(result.bblReducedAnnual, 0),
    ],
    [
      "Terminal Transmix Savings",
      formatCurrency(result.grossSavingsPerEvent),
      formatCurrency(result.grossSavingsMonthly),
      formatCurrency(result.grossSavingsAnnual),
    ],
    [
      "CMaaS Costs",
      "",
      formatCurrency(result.cmaaSCostMonthly),
      formatCurrency(result.cmaaSCostAnnual),
    ],
    [
      "Projected Savings",
      "",
      formatCurrency(result.netSavingsMonthly),
      formatCurrency(result.netSavingsAnnual),
    ],
    [
      "Projected ROI",
      "",
      formatRoiPercent(result.roiPercent),
      formatRoiPercent(result.roiPercent),
    ],
  ];

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-[#cbd8e1] bg-white">
      <div className="result-grid-header grid grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr] border-b border-[#d2dde5] bg-[#eef4f5] px-4 py-3 text-xs font-bold tracking-[0.12em] text-[#526275]">
        <span>PROJECTED RESULTS</span>
        <span className="text-right">PER EVENT</span>
        <span className="text-right">MONTHLY</span>
        <span className="text-right">ANNUAL</span>
      </div>
      {rows.map(([label, perEvent, monthly, annual]) => (
        <div
          key={label}
          className="result-grid grid grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-[#edf2f4] px-4 py-3 transition-colors duration-150 hover:bg-[#f4faf8] last:border-b-0"
        >
          <span className="text-sm font-medium text-[#526275]">{label}</span>
          <span className="text-right text-sm font-semibold tabular-nums">
            {perEvent || "-"}
          </span>
          <span className="text-right text-sm font-semibold tabular-nums">
            {monthly}
          </span>
          <span className="text-right text-sm font-semibold tabular-nums">
            {annual}
          </span>
        </div>
      ))}
    </div>
  );
}

function BreakdownList({ title, rows }) {
  return (
    <div>
      <h3 className="border-b border-[#cfdbe4] pb-3 text-xl font-semibold">
        {title}
      </h3>
      <dl className="mt-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[#edf2f4] py-3 transition-colors duration-150 hover:bg-[#f4faf8]"
          >
            <dt className="text-sm leading-6 text-[#526275]">{label}</dt>
            <dd className="text-right text-sm font-semibold leading-6 tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ReferenceDataTable({ selectedPipe }) {
  return (
    <section className="border-y border-[#d7e0e7] bg-[#f3f7f7] py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <h2 className="text-3xl font-semibold">PST Reference Data</h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.65fr]">
          <div className="overflow-hidden rounded-xl border border-[#cbd8e1] bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#0a315d] text-white">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Pipe Size
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Calculated Fluid Volume
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    2-Year CMaaS / Month
                  </th>
                </tr>
              </thead>
              <tbody>
                {PIPE_SIZES.map((pipe) => {
                  const ref = PIPE_REFERENCE[pipe];
                  const selected = pipe === selectedPipe;
                  return (
                    <tr
                      key={pipe}
                      className={
                        selected
                          ? "bg-[#e7f2ef] text-[#071b34] transition-colors duration-150 hover:bg-[#dcece8]"
                          : "border-t border-[#edf2f4] transition-colors duration-150 hover:bg-[#f4faf8]"
                      }
                    >
                      <th scope="row" className="px-4 py-3 font-semibold">
                        {pipe}"
                      </th>
                      <td className="px-4 py-3 tabular-nums">
                        {formatNumber(pipe, 1)} BBL/min
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatCurrency(ref.cmaaSTwoYearMonthly, { cents: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid content-start gap-5">
            <ReferenceGroup
              title="Inputs"
              items={[
                "Average Pipe Size",
                "Average Velocity",
                "Reprocessing Cost",
                "Transmix Processing Time",
                "Events per Month",
              ]}
            />
            <ReferenceGroup
              title="PST assumption"
              items={["Projected Yield Loss Improvement"]}
            />
            <ReferenceGroup
              title="PST reference data"
              items={[
                "Calculated Fluid Volume by Pipe Size",
                "2-Year CMaaS Monthly Price by Pipe Size",
                `Purchase Pricing Reference: ${formatCurrency(
                  PURCHASE_PRICING_REFERENCE.baseUnitPrice
                )} base unit, ${formatCurrency(
                  PURCHASE_PRICING_REFERENCE.increasePerTwoInchIncrement
                )} per 2" pipe diameter increment`,
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ReferenceGroup({ title, items }) {
  return (
    <div className="rounded-xl border border-[#cbd8e1] bg-white p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-[#526275]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
