#!/bin/sh
set -e
pnpm exec prisma db push
exec "$@"
