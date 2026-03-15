declare module "@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs" {
  export class QueryCompiler {
    constructor(options: any);
    compile(query: string): any;
    compileBatch(query: string): any;
    free(): void;
  }

  export function __wbg_set_wasm(exports: unknown): void;
}

declare module "@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs" {
  export const wasm: string;
}
