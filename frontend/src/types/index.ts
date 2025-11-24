import { fileURLToPath } from 'node:url'
import MagicString from 'magic-string'
import type { Router, RouteLocationNormalizedLoadedGeneric } from 'vue-router'

const s = new MagicString('hello')
export { s }

declare module 'vue' {
  interface ComponentCustomProperties {
    $router: Router
    $route: RouteLocationNormalizedLoadedGeneric
  }
}
