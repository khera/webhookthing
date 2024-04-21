#!/bin/sh

# run this in the root directory of the project to regenerate the type checking
# configurations from the database and the OpenAPI specification.

# The files generated by this script should be set to read-only in the `.vscode/settings.json` file.

# requires the following to be installed:
# - supabase (npm developer dependency)
# - @redocly/cli (npm developer dependency)
# - jq (brew install jq)
# - mermerd (download directly from https://github.com/KarnerTh/mermerd)

if ! test -d app/lib/generated
then
   echo "run in project root directory"
   exit 1
fi

trap cleanup 1 2 3 6

cleanup()
{
  echo "Caught Signal ... cleaning up."
  exit 1
}

npx supabase status > /dev/null || exit 1

# generate the typescript definitions for the database schema.
npx supabase gen types typescript --local > app/lib/generated/database.types.ts

# make a flattened compacted JSON version of the schema for the API documentation page
npx @redocly/cli bundle --dereferenced --ext json __design__/PublicAPI.yml | jq --compact-output . > app/lib/generated/PublicAPI.json 

mermerd -c postgresql://postgres:postgres@localhost:54322/postgres  -o __design__/db_schema_diagram.mmd --schema public --useAllTables

# dump the current public schema for reference
npx supabase db dump --local --keep-comments > supabase/current_schema.sql

git status
