import { App } from './src/app/App';
import { wrapRootComponent } from './src/core/observability/sentry';

// Wrap so React tree errors bubble up to Sentry with a component stack.
// When the DSN is empty this is a passthrough — no runtime cost.
export default wrapRootComponent(App);
