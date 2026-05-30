function padSequence(sequence: number) {
  return sequence.toString().padStart(3, "0");
}

export function formatSpuDate(date: Date) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}${month}${day}`;
}

export function buildSpu(date: Date, sequence: number) {
  return `SPU-${formatSpuDate(date)}-${padSequence(sequence)}`;
}
