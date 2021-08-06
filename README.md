# unimg

First, [install pnpm](https://pnpm.io/installation)

Start the server:

```sh
pnpm install
pnpm run dev
```

Request a file in any publicly available docker image:

```sh
# https://httpie.io/
http --follow --all :8080/nginx/bin/bash

# or with curl
curl --verbose --location http://localhost:8080/nginx/bin/bash
```
