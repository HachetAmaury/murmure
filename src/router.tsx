import {
    createRouter,
    createRoute,
    createRootRoute,
    Navigate,
} from '@tanstack/react-router';
import { Home } from './features/home/home';
import { Layout } from './features/layout/layout';
import { About } from './features/about/about';
import { Shortcuts } from './features/settings/shortcuts/shortcuts';
import { CustomDictionary } from './features/settings/custom-dictionary/custom-dictionary';
import { System } from './features/settings/system/system';
import { Webhook } from './features/settings/webhook/webhook';

const rootRoute = createRootRoute({
    component: () => <Layout />,
});

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home,
});

const settingsShortcutsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings/shortcuts',
    component: Shortcuts,
});

const settingsCustomDictionaryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings/custom-dictionary',
    component: CustomDictionary,
});

const settingsSystemRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings/system',
    component: System,
});

const settingsWebhookRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings/webhook',
    component: Webhook,
});

const settingsIndexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => <Navigate to="/settings/shortcuts" />,
});

const aboutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/about',
    component: About,
});

const routeTree = rootRoute.addChildren([
    indexRoute,
    settingsIndexRoute,
    settingsShortcutsRoute,
    settingsCustomDictionaryRoute,
    settingsSystemRoute,
    settingsWebhookRoute,
    aboutRoute,
]);

export const router = createRouter({ routeTree });
