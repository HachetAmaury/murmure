export const formatTime = (timestamp: number, t: (key: string) => string) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('Just now');
    if (diffMins < 60) return t('{{minutes}}m ago').replace('{{minutes}}', diffMins.toString());
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('{{hours}}h ago').replace('{{hours}}', diffHours.toString());
    const diffDays = Math.floor(diffHours / 24);
    return t('{{days}}d ago').replace('{{days}}', diffDays.toString());
};

export const formatResponseBody = (responseBody: string): string => {
    // Try to parse as JSON and format it
    try {
        const parsed = JSON.parse(responseBody);
        return JSON.stringify(parsed, null, 2);
    } catch {
        // If not valid JSON, return as-is (truncate if too long)
        if (responseBody.length > 1000) {
            return responseBody.substring(0, 1000) + '...';
        }
        return responseBody;
    }
};

