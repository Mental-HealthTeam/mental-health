export function formatCount(value: number): string {
    const stringValue = String(value)

    if (stringValue.length > 6) {
        return `${Math.floor(value / 1000000)}m+`
    } else if (stringValue.length > 3) {
        return `${Math.floor(value / 1000)}k+`
    }

    return `${stringValue}+`
}
