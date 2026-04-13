# Roadmap

## Legend
- ✅ Implemented
- ⬜ Pending

---

## OsvClient (entry point)

| Method | Endpoint | Status |
|--------|----------|--------|
| `vuln(id)` | — chainable | ✅ |
| `query(params)` | `POST /v1/query` | ✅ |
| `queryBatch(queries)` | `POST /v1/querybatch` | ✅ |

---

## VulnerabilityResource

| Method | Endpoint | Status |
|--------|----------|--------|
| `get()` | `GET /v1/vulns/{id}` | ✅ |

---

## Planned: Pagination support

| Feature | Description | Status |
|---------|-------------|--------|
| `query()` auto-pagination | Follow `next_page_token` automatically | ⬜ |
| `queryAll(params)` | Convenience method that collects all pages | ⬜ |

---

## Planned: Ecosystem helpers

| Method | Description | Status |
|--------|-------------|--------|
| `queryNpm(name, version)` | Shorthand for `query` with `ecosystem: 'npm'` | ⬜ |
| `queryPyPI(name, version)` | Shorthand for `query` with `ecosystem: 'PyPI'` | ⬜ |
| `queryGo(module, version)` | Shorthand for `query` with `ecosystem: 'Go'` | ⬜ |
| `queryMaven(name, version)` | Shorthand for `query` with `ecosystem: 'Maven'` | ⬜ |
| `queryNuGet(name, version)` | Shorthand for `query` with `ecosystem: 'NuGet'` | ⬜ |
| `queryCargo(name, version)` | Shorthand for `query` with `ecosystem: 'crates.io'` | ⬜ |
