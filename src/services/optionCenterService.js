import { OPTION_GROUPS } from "./optionService.js";
import { exportRecordsToCsv } from "./exportService.js";

const OPTION_EXPORT_COLUMNS = [
  { key: "group", label: "Grupo" },
  { key: "name", label: "Nome" },
  { key: "value", label: "Valor" },
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function uniqueGroups(options) {
  return Array.from(new Set([
    ...OPTION_GROUPS,
    ...options.map((option) => option.group).filter(Boolean),
  ]));
}

export function buildOptionGroups(options) {
  return uniqueGroups(options)
    .map((group) => {
      const groupOptions = options
        .filter((option) => option.group === group)
        .sort((first, second) => String(first.name).localeCompare(String(second.name)));

      return {
        id: group,
        label: group,
        count: groupOptions.length,
        empty: groupOptions.length === 0,
        options: groupOptions,
      };
    })
    .sort((first, second) => {
      if (first.empty !== second.empty) {
        return first.empty ? 1 : -1;
      }

      return first.label.localeCompare(second.label);
    });
}

export function buildOptionMetrics(options) {
  const groups = buildOptionGroups(options);
  const emptyGroups = groups.filter((group) => group.empty);
  const largestGroup = groups.reduce((currentLargest, group) =>
    group.count > currentLargest.count ? group : currentLargest,
  { count: 0, label: "-" });

  return [
    {
      id: "groups",
      icon: "layoutGrid",
      label: "Grupos",
      value: groups.length,
      detail: "listas disponiveis",
      tone: "blue",
    },
    {
      id: "options",
      icon: "plus",
      label: "Opcoes",
      value: options.length,
      detail: "valores cadastrados",
      tone: "green",
    },
    {
      id: "empty",
      icon: "archive",
      label: "Grupos vazios",
      value: emptyGroups.length,
      detail: "sem valores locais",
      tone: emptyGroups.length ? "yellow" : "green",
    },
    {
      id: "largest",
      icon: "gauge",
      label: "Maior grupo",
      value: largestGroup.count,
      detail: largestGroup.label,
      tone: "red",
    },
  ];
}

export function filterOptionGroups(groups, searchTerm) {
  const normalizedTerm = normalizeText(searchTerm);

  if (!normalizedTerm) {
    return groups;
  }

  return groups.filter((group) =>
    [group.label, ...group.options.map((option) => `${option.name} ${option.value}`)]
      .join(" ")
      .toLowerCase()
      .includes(normalizedTerm)
  );
}

export function validateOptionPayload(payload, options, editingRecord) {
  const group = String(payload.group || "").trim();
  const value = String(payload.value || "").trim();

  if (!group || !value) {
    return "Grupo e valor sao obrigatorios.";
  }

  const duplicated = options.some((option) =>
    option.id !== editingRecord?.id &&
    normalizeText(option.group) === normalizeText(group) &&
    normalizeText(option.value) === normalizeText(value)
  );

  if (duplicated) {
    return `Opcao duplicada no grupo ${group}.`;
  }

  return "";
}

export function buildOptionPayload(payload) {
  return {
    ...payload,
    name: String(payload.name || payload.value || "").trim(),
    value: String(payload.value || payload.name || "").trim(),
  };
}

export function exportOptions(options, filename = "opcoes-do-sistema") {
  exportRecordsToCsv({
    columns: OPTION_EXPORT_COLUMNS,
    filename,
    records: options,
    snapshot: {},
  });
}
