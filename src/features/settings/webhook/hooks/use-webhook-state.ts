import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useWebhookState = () => {
    const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
    const [webhookToken, setWebhookToken] = useState<string | null>(null);

    const loadWebhookState = async () => {
        try {
            const url = await invoke<string | null>('get_webhook_url');
            const token = await invoke<string | null>('get_webhook_token');
            setWebhookUrl(url);
            setWebhookToken(token);
        } catch (error) {
            console.error('Failed to load webhook state:', error);
        }
    };

    useEffect(() => {
        loadWebhookState();

        // Listen for webhook errors
        const unlisten = listen<string>('webhook:error', (event) => {
            toast.error('Webhook error', {
                description: event.payload,
                duration: 5000,
                closeButton: true,
            });
        });

        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    const handleSetWebhookUrl = async (url: string | null) => {
        try {
            setWebhookUrl(url);
            await invoke('set_webhook_url', { url: url || null });
        } catch (error) {
            console.error('Failed to set webhook URL:', error);
            toast.error('Failed to save webhook URL', {
                duration: 2000,
                closeButton: true,
            });
            // Revert the state on error
            await loadWebhookState();
        }
    };

    const handleSetWebhookToken = async (token: string | null) => {
        try {
            setWebhookToken(token);
            await invoke('set_webhook_token', { token: token || null });
        } catch (error) {
            console.error('Failed to set webhook token:', error);
            toast.error('Failed to save webhook token', {
                duration: 2000,
                closeButton: true,
            });
            // Revert the state on error
            await loadWebhookState();
        }
    };

    return {
        setWebhookUrl: handleSetWebhookUrl,
        setWebhookToken: handleSetWebhookToken,
        webhookUrl,
        webhookToken,
    };
};

