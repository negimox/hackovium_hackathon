"use client";

export interface WatchlistSection {
    name: string;
    itemIds: string[];
}

export interface CreatedList {
    id: string;
    name: string;
    itemIds: string[]; // For backward compatibility / default section
    sections?: WatchlistSection[];
}

const STORAGE_KEY = "ploutos_custom_watchlists";

export function getCreatedLists(): CreatedList[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function saveCreatedLists(lists: CreatedList[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    window.dispatchEvent(new Event("custom-watchlists-changed"));
}

export function addCreatedList(name: string) {
    const lists = getCreatedLists();
    const newList: CreatedList = {
        id: `list-${Date.now()}`,
        name,
        itemIds: [],
    };
    saveCreatedLists([...lists, newList]);
    return newList;
}

export function addItemToList(listId: string, itemId: string, sectionName?: string) {
    const lists = getCreatedLists();
    const updated = lists.map((l) => {
        if (l.id !== listId) return l;

        if (sectionName && l.sections) {
            const sections = l.sections.map(s =>
                s.name === sectionName
                    ? { ...s, itemIds: [...new Set([...s.itemIds, itemId])] }
                    : s
            );
            return { ...l, sections };
        }

        return { ...l, itemIds: [...new Set([...l.itemIds, itemId])] };
    });
    saveCreatedLists(updated);
}

export function addSectionToList(listId: string, sectionName: string) {
    const lists = getCreatedLists();
    const updated = lists.map((l) => {
        if (l.id !== listId) return l;
        const sections = l.sections || [];
        if (sections.some(s => s.name === sectionName)) return l;
        return { ...l, sections: [...sections, { name: sectionName, itemIds: [] }] };
    });
    saveCreatedLists(updated);
}

export function updateSectionName(listId: string, oldName: string, newName: string) {
    const lists = getCreatedLists();
    const updated = lists.map((l) => {
        if (l.id !== listId || !l.sections) return l;
        return {
            ...l,
            sections: l.sections.map(s => s.name === oldName ? { ...s, name: newName } : s)
        };
    });
    saveCreatedLists(updated);
}

export function removeSectionFromList(listId: string, sectionName: string) {
    const lists = getCreatedLists();
    const updated = lists.map((l) => {
        if (l.id !== listId || !l.sections) return l;
        return { ...l, sections: l.sections.filter(s => s.name !== sectionName) };
    });
    saveCreatedLists(updated);
}

export function removeItemFromList(listId: string, itemId: string) {
    const lists = getCreatedLists();
    const updated = lists.map((l) =>
        l.id === listId
            ? { ...l, itemIds: l.itemIds.filter((id) => id !== itemId) }
            : l
    );
    saveCreatedLists(updated);
}

export function updateCreatedList(listId: string, name: string) {
    const lists = getCreatedLists();
    const updated = lists.map((l) =>
        l.id === listId ? { ...l, name } : l
    );
    saveCreatedLists(updated);
}

export function deleteCreatedList(listId: string) {
    const lists = getCreatedLists();
    saveCreatedLists(lists.filter((l) => l.id !== listId));
}
