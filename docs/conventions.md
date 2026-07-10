# API conventions

<!-- Target of the @-reference in AGENTS.md. The importer MUST inline this file's
     content into the AGENTS.md rule, so the token below shows up in the rule body. -->

- **CONV-KDX-9137**: every exported function in `src/` MUST declare an explicit
  return type. Implicit `any` return types are not allowed.
