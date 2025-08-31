// Tamil-friendly parser
export function parseExpenseInput(text) {
  if (!text || !text.trim()) return [];

  const t = text.trim();

  // format: Name - Amount
  if (t.includes("-")) {
    const [left, right] = t.split("-");
    const nameCombined = left.replace(/\s*,\s*/g, ", ").trim();
    const parts = right.split(",").map(p => p.trim()).filter(Boolean);
    const entries = [];
    for (const p of parts) {
      const n = Number(p.replace(/[^\d.]/g, ""));
      if (!isNaN(n)) entries.push({ name: nameCombined, amount: n });
    }
    return entries;
  }

  const match = t.match(/^(.*?)[\s]*([0-9]+)\s*$/u);
  if (match) {
    const name = match[1].replace(/\s*,\s*/g, ", ").trim();
    const amount = Number(match[2]);
    if (name && !isNaN(amount)) return [{ name, amount }];
  }

  return [];
}
