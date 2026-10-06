# Supply chain

## SBOM

Every push to `main` runs the [sbom workflow](../.github/workflows/sbom.yml). Download the **sbom** artifact from the latest successful run (SPDX JSON).

Generate locally:

```bash
docker run --rm -v "$PWD:/work" anchore/syft:latest dir:/work -o spdx-json > sbom.spdx.json
```

## Container signing (optional)

Image signing with [cosign](https://docs.sigstore.dev/) is not wired in CI yet. When you add it:

1. Create `COSIGN_PRIVATE_KEY` / `COSIGN_PASSWORD` (or keyless OIDC) in GitHub secrets.
2. Sign after `docker build`: `cosign sign --yes ghcr.io/you/mck-gateway@${DIGEST}`

## npm provenance

Packages use `repository.directory` in each `package.json`. Enable [npm provenance](https://docs.npmjs.com/generating-provenance-statements) on the release workflow when publishing from GitHub Actions.
