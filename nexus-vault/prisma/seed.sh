#!/bin/sh
# Seeds the database inside the container
npx -y ts-node@10.9.2 --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
