#!/bin/bash
# Copia un proyecto Supabase entero (tablas, datos, funciones, usuarios) dentro del Supabase compartido,
# en un esquema propio. Uso:  bash copiar-supabase.sh leadpoolclub
# Te pedirá dos cadenas de conexión (las copias del panel de Supabase → botón "Connect" → "Session pooler").
# Las contraseñas solo se escriben en tu Mac; no se guardan en ningún sitio.
set -euo pipefail
ESQ="${1:?Pon el nombre del esquema, p.ej. leadpoolclub}"
command -v pg_dump >/dev/null || { echo "Instalando herramientas de Postgres..."; brew install libpq && brew link --force libpq; }
echo; echo "1) Pega la conexión del proyecto ORIGEN ($ESQ) y pulsa Enter:"; read -rs ORIGEN; echo
echo "2) Pega la conexión del proyecto DESTINO (ecobeachcity, el compartido) y pulsa Enter:"; read -rs DESTINO; echo
D=$(mktemp -d); trap 'rm -rf "$D"' EXIT
echo "Copiando estructura y datos de public..."
pg_dump "$ORIGEN" --schema=public --no-owner --no-privileges --no-comments > "$D/public.sql"
# renombrar public -> esquema propio
sed -E -e "s/\bpublic\./${ESQ}./g" \
       -e "s/SET search_path = public/SET search_path = ${ESQ}/" \
       -e "s/'public'/'${ESQ}'/g" \
       -e "/^CREATE SCHEMA public;/d" -e "/^COMMENT ON SCHEMA public/d" \
       "$D/public.sql" > "$D/esquema.sql"
echo "Copiando usuarios (los que ya existan por email se respetan)..."
pg_dump "$ORIGEN" --data-only --inserts --on-conflict-do-nothing -t auth.users -t auth.identities > "$D/auth.sql"
echo "Cargando en el destino..."
psql "$DESTINO" -v ON_ERROR_STOP=0 -q -c "create schema if not exists ${ESQ};" \
  -c "grant usage on schema ${ESQ} to anon, authenticated, service_role;" > "$D/log.txt" 2>&1
psql "$DESTINO" -v ON_ERROR_STOP=0 -q -f "$D/auth.sql" >> "$D/log.txt" 2>&1
psql "$DESTINO" -v ON_ERROR_STOP=0 -q -f "$D/esquema.sql" >> "$D/log.txt" 2>&1
psql "$DESTINO" -q -c "grant all on all tables in schema ${ESQ} to anon, authenticated, service_role; grant all on all sequences in schema ${ESQ} to anon, authenticated, service_role; grant execute on all functions in schema ${ESQ} to anon, authenticated, service_role; notify pgrst, 'reload schema';" >> "$D/log.txt" 2>&1
echo; echo "Comprobación (filas por tabla en origen y destino):"
Q="select relname, n_live_tup from pg_stat_user_tables where schemaname='%s' order by n_live_tup desc limit 10"
psql "$ORIGEN"  -At -c "$(printf "$Q" public)"  | sed 's/^/origen  /'
psql "$DESTINO" -At -c "analyze; $(printf "$Q" "$ESQ")" | sed 's/^/destino /'
echo; echo "Errores (si hay):"; grep -iE "error" "$D/log.txt" | sort | uniq -c | head -20 || echo "ninguno"
echo; echo "Hecho. Copia el texto de arriba y pégaselo a Claude."
