# NumberFlow Contributing Guide

## Updating screenshots

```sh
docker run -it -v $(pwd):/work/ -w /work/ --rm --ipc=host mcr.microsoft.com/playwright:v1.48.0-jammy /bin/bash

corepack enable pnpm
pnpm config set store-dir /root/.local/share/pnpm/store
pnpm install
# e.g. cd into a package and run `pnpm test:update`
```
