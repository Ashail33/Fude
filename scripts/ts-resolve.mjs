/**
 * Lets the build scripts import the game's TypeScript data modules
 * (e.g. src/art/hd/manifest.ts) under Node's type stripping: source files
 * import each other without extensions, Vite-style, so try `.ts`, `.tsx`
 * and `/index.ts` when a relative import has none.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs …
 */
import { register } from 'node:module'

register(
  'data:text/javascript,' +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if ((spec.startsWith('.') || spec.startsWith('/')) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
          for (const ext of ['.ts', '.tsx', '/index.ts']) {
            try { return await next(spec + ext, ctx) } catch {}
          }
        }
        return next(spec, ctx)
      }
    `),
  import.meta.url,
)
