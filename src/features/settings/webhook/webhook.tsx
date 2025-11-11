import { Input } from '@/components/input';
import { SettingsUI } from '@/components/settings-ui';
import { Typography } from '@/components/typography';
import { Page } from '@/components/page';
import { useWebhookState } from './hooks/use-webhook-state';
import { useWebhookHistoryState } from './hooks/use-webhook-history-state';
import { formatTime, formatResponseBody } from './webhook.helpers';
import { useState } from 'react';
import {
    Send as SendIcon,
    Trash2,
    CheckCircle2,
    XCircle,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/dialog';
import { Button } from '@/components/button';
import { useTranslation } from '@/i18n';

interface WebhookHistoryEntryProps {
    entry: {
        id: number;
        timestamp: number;
        text: string;
        success: boolean;
        error_message: string | null;
        response_body: string | null;
    };
}

const WebhookHistoryEntry = ({ entry }: WebhookHistoryEntryProps) => {
    const [isResponseExpanded, setIsResponseExpanded] = useState(false);
    const { t } = useTranslation();

    return (
        <div className="rounded-md border border-zinc-700 p-3 hover:bg-zinc-800">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {entry.success ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <Typography.Paragraph className="text-sm">
                            {entry.text === '' ? (
                                <span className="italic text-xs">
                                    {t('(Empty transcription)')}
                                </span>
                            ) : (
                                entry.text
                            )}
                        </Typography.Paragraph>
                    </div>
                    {entry.error_message && (
                        <Typography.Paragraph className="text-xs text-red-400 mt-1 ml-6">
                            {entry.error_message}
                        </Typography.Paragraph>
                    )}
                    {entry.response_body && (
                        <div className="mt-2 ml-6">
                            <div className="flex items-center justify-between mb-1">
                                <Typography.Paragraph className="text-xs text-zinc-400">
                                    {t('Response:')}
                                </Typography.Paragraph>
                                <button
                                    onClick={() =>
                                        setIsResponseExpanded(
                                            !isResponseExpanded
                                        )
                                    }
                                    className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                    aria-label={
                                        isResponseExpanded
                                            ? t('Collapse response')
                                            : t('Expand response')
                                    }
                                >
                                    {isResponseExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {isResponseExpanded && (
                                <pre className="text-xs bg-zinc-900 border border-zinc-700 rounded p-2 overflow-x-auto max-w-full">
                                    {formatResponseBody(entry.response_body)}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
                <Typography.Paragraph className="text-xs block w-20 text-right flex-shrink-0">
                    {formatTime(entry.timestamp, t)}
                </Typography.Paragraph>
            </div>
        </div>
    );
};

export const Webhook = () => {
    const { webhookUrl, setWebhookUrl, webhookToken, setWebhookToken } =
        useWebhookState();
    const { history } = useWebhookHistoryState();
    const { t } = useTranslation();
    const [showToken, setShowToken] = useState(false);

    const handleClearHistory = async () => {
        try {
            await invoke('clear_webhook_history');
            toast.success(t('Webhook history cleared'), {
                duration: 1500,
                closeButton: true,
            });
        } catch (error) {
            toast.error(t('Failed to clear webhook history'), {
                duration: 2000,
                closeButton: true,
            });
            console.error('Clear webhook history error:', error);
        }
    };

    return (
        <main>
            <div className="space-y-8">
                <Page.Header>
                    <Typography.MainTitle>{t('Webhook')}</Typography.MainTitle>
                    <Typography.Paragraph className="text-zinc-400">
                        {t(
                            'Configure a webhook URL to receive HTTP requests after each transcription. The webhook will be called with the transcribed text, timestamp, and duration.'
                        )}
                    </Typography.Paragraph>
                </Page.Header>

                <div className="flex justify-center">
                    <SettingsUI.Container>
                        <SettingsUI.Item>
                            <SettingsUI.Description>
                                <Typography.Title className="flex items-center gap-2">
                                    <SendIcon className="w-4 h-4 text-zinc-400" />
                                    {t('Webhook URL')}
                                </Typography.Title>
                                <Typography.Paragraph className="space-y-2">
                                    <div>
                                        {t(
                                            'Enter the URL where webhook requests should be sent after each transcription. Leave empty to disable webhooks.'
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {t(
                                            'The webhook will receive a POST request with JSON payload containing:'
                                        )}
                                        <code className="block mt-1 p-2 bg-zinc-800 rounded border border-zinc-700">
                                            {`{\n  "text": "...",\n  "timestamp": "2024-...",\n  "duration": 5.2\n}`}
                                        </code>
                                    </div>
                                </Typography.Paragraph>
                            </SettingsUI.Description>
                            <Input
                                type="url"
                                placeholder="https://example.com/webhook"
                                value={webhookUrl || ''}
                                onChange={(e) =>
                                    setWebhookUrl(e.target.value.trim() || null)
                                }
                                className="w-96"
                            />
                        </SettingsUI.Item>
                        <SettingsUI.Separator />
                        <SettingsUI.Item>
                            <SettingsUI.Description>
                                <Typography.Title className="flex items-center gap-2">
                                    <SendIcon className="w-4 h-4 text-zinc-400" />
                                    {t('Webhook Token')}
                                </Typography.Title>
                                <Typography.Paragraph className="space-y-2">
                                    <div>
                                        {t(
                                            'Optional authentication token to include in the Authorization header as Bearer token. Leave empty to disable authentication.'
                                        )}
                                    </div>
                                </Typography.Paragraph>
                            </SettingsUI.Description>
                            <div className="relative w-96">
                                <Input
                                    type={showToken ? 'text' : 'password'}
                                    placeholder={t('Bearer token (optional)')}
                                    value={webhookToken || ''}
                                    onChange={(e) =>
                                        setWebhookToken(
                                            e.target.value.trim() || null
                                        )
                                    }
                                    className="w-full pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                    aria-label={
                                        showToken
                                            ? t('Hide token')
                                            : t('Show token')
                                    }
                                >
                                    {showToken ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </SettingsUI.Item>
                    </SettingsUI.Container>
                </div>

                <div className="space-y-2 w-full max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                        <Typography.Title>
                            {t('Recent activity')}
                        </Typography.Title>
                        {history.length > 0 && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Trash2 className="size-4 cursor-pointer hover:text-zinc-100 text-zinc-400 transition-colors" />
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {t('Clear Webhook History')}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {t(
                                                'Are you sure you want to clear all webhook history? This action cannot be undone.'
                                            )}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button
                                                variant="outline"
                                                className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100"
                                            >
                                                {t('Cancel')}
                                            </Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button
                                                variant="destructive"
                                                onClick={handleClearHistory}
                                            >
                                                {t('Clear')}
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    {history.length === 0 ? (
                        <Typography.Paragraph>
                            {t('No webhook calls yet')}
                        </Typography.Paragraph>
                    ) : (
                        <div className="space-y-2 mb-8">
                            {history.map((entry) => (
                                <WebhookHistoryEntry
                                    key={entry.id}
                                    entry={entry}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

