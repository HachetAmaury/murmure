import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useState, useEffect } from 'react';

export interface WebhookHistoryEntry {
    id: number;
    timestamp: number;
    text: string;
    success: boolean;
    error_message: string | null;
    duration: number | null;
    response_body: string | null;
}

export const useWebhookHistoryState = () => {
    const [history, setHistory] = useState<WebhookHistoryEntry[]>([]);

    useEffect(() => {
        loadHistory();

        const unlistenPromise = listen('webhook-history-updated', () => {
            loadHistory();
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    const loadHistory = async () => {
        try {
            const entries = await invoke<WebhookHistoryEntry[]>(
                'get_webhook_history'
            );
            setHistory(entries);
        } catch (e) {
            console.error('Failed to load webhook history:', e);
        }
    };

    return {
        history,
        loadHistory,
    };
};

