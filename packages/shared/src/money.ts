/** Format paise → ₹ Indian grouping. */
export function formatInrPaise(paise: number): string {
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}
