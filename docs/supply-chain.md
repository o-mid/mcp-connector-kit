# Supply chain

## SBOM

Every push to `main` runs the [sbom workflow](../.github/workflows/sbom.yml). Download the **sbom** artifact from the latest successful run (SPDX JSON).

Generate locally:

```bash
docker run --rm -v "$PWD:/work" anchore/syft:latest dir:/work -o spdx-json > sbom.spdx.json
```

## Container signing

On tag push `v*` (or manual **container-release** workflow), GitHub Actions builds the root `Dockerfile`, pushes to `ghcr.io/<owner>/mcp-connector-kit`, and signs the digest with [cosign](https://docs.sigstore.dev/) keyless OIDC.

Verify after pull:

```bash
cosign verify ghcr.io/o-mid/mcp-connector-kit:latest --certificate-identity-regexp='.*' --certificate-oidc-issuer=https://token.actions.githubusercontent.com
```

Railway deploys still use the repo `Dockerfile` directly; GHCR images are for mirrored or air-gapped pulls.

## npm provenance

The [release workflow](../.github/workflows/release.yml) sets `NPM_CONFIG_PROVENANCE=true` when `NPM_TOKEN` is configured. Packages include `publishConfig.access: public` and `repository.directory` for npm provenance statements.
