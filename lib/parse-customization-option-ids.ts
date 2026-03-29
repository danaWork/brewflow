/** Selected modifier option UUIDs stored on order_items.customizations JSON under `__optionIds`. */
export function parseCustomizationOptionIds(customizations: string | null | undefined): string[] {
    if (!customizations) return [];
    try {
        const obj = JSON.parse(customizations) as Record<string, unknown>;
        const ids = obj.__optionIds;
        if (!Array.isArray(ids)) return [];
        return ids.filter((x): x is string => typeof x === 'string' && x.length > 0);
    } catch {
        return [];
    }
}
