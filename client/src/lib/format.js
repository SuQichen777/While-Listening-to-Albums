// 2024-08-25T00:00:00.000Z -> 2024.08.25
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replaceAll("-", ".");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}.${month}.${day}`;
}

// delay of the reveal animation, rows far down the list do not wait forever
export function revealStyle(index) {
  return { "--i": Math.min(index, 10) };
}

// NetEase serves 2000px originals by default, ask its image server for the size we show
export function coverUrl(url, size = 400) {
  if (!url) return "";
  return /music\.126\.net\//.test(url) && !url.includes("?") ? `${url}?param=${size}y${size}` : url;
}
