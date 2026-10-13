export type SelectableOptionGroup = {
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: Array<{ id: string }>;
};

export function findInvalidOptionGroup(
  groups: SelectableOptionGroup[],
  selectedOptionIds: Iterable<string>
): SelectableOptionGroup | null {
  const selected = new Set(selectedOptionIds);
  return groups.find((group) => {
    const count = group.options.filter((option) => selected.has(option.id)).length;
    return count < group.minSelect || count > group.maxSelect;
  }) ?? null;
}
