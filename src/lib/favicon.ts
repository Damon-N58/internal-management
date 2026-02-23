export function getFaviconUrl(website: string | null): string | null {
  if (!website) return null
  try {
    let domain = website.trim()
    if (!domain.startsWith("http")) domain = `https://${domain}`
    const url = new URL(domain)
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`
  } catch {
    return null
  }
}
