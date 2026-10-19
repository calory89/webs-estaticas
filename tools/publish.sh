#!/bin/bash
# Actualiza la rama pub/<dominio> con el contenido de sites/<dominio> en HEAD (solo si cambió).
for d in "$@"; do
  t=$(git rev-parse HEAD:sites/$d) || continue
  p=$(git ls-remote origin refs/heads/pub/$d | cut -f1)
  if [ -n "$p" ] && git cat-file -e $p 2>/dev/null && [ "$(git rev-parse $p^{tree})" = "$t" ]; then echo "$d sin cambios"; continue; fi
  c=$(git commit-tree $t ${p:+-p $p} -m "Publicar $d")
  git push -q origin $c:refs/heads/pub/$d 2>&1 | grep -iE 'error|fatal|rejected' | head -2
  echo "$d -> $(git ls-remote origin refs/heads/pub/$d | cut -c1-8) (esperado ${c:0:8})"
done
