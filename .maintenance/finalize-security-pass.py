from pathlib import Path
import json

p = Path('app/_features/ops/components/OpsReservationDrawer.tsx')
s = p.read_text()
old = 'statusTone: "warning" | "success";'
assert s.count(old) == 1
p.write_text(s.replace(old, 'statusTone: "warning" | "success" | "danger" | "outline";'))

p = Path('app/_features/reservation/components/ReservationTunnel.tsx')
s = p.read_text()
a = s.index('  const resolvedConfirmationRecord = useMemo(')
b = s.index('  const confirmationSnapshot:', a)
c = s.index('  const durationDays =', b)
first = s[a:b].replace('      planningReservations,\n', '')
second = s[b:c].replace('      currentReservationId,\n', '').replace('      planningReservations,\n', '')
p.write_text(s[:a] + first + second + s[c:])

p = Path('app/_features/ops/data/ops-store.ts')
s = p.read_text()
a = s.index('async function updateStore<T>(')
b = s.index('\nfunction invalidatePublicData()', a)
section = s[a:b]
assert section.count('return withOpsDatabaseStoreTransaction(') == 1
section = section.replace('return withOpsDatabaseStoreTransaction(', 'const result = await withOpsDatabaseStoreTransaction(', 1)
section = section.replace('      invalidatePublicData();\n', '', 1)
old = '      return result;\n    });\n  }'
assert section.count(old) == 1
section = section.replace(old, '      return result;\n    });\n    // Publish invalidation only after the transaction has committed.\n    invalidatePublicData();\n    return result;\n  }', 1)
p.write_text(s[:a] + section + s[b:])

p = Path('package.json')
d = json.loads(p.read_text())
d['dependencies']['sharp'] = '0.35.4'
d['devDependencies'].pop('sharp', None)
d['overrides'] = {'postcss': '8.5.23', 'sharp': '$sharp'}
p.write_text(json.dumps(d, indent=2) + '\n')

p = Path('docs/SECURITY_DATA_PASS_1.md')
s = p.read_text()
s += '''
## Dépendances de sécurité complémentaires

Next.js reste sur 15.5.24. Le graphe transitif de cette version conserve des bibliothèques
signalées par npm : override PostCSS 8.5.23 et Sharp 0.35.4 (également dépendance runtime
explicite). Ces overrides ne doivent pas être retirés tant que le parent ne fournit pas
une version corrigée. Les autres correctifs compatibles sont résolus par npm sans --force.
Un test encode puis décode AVIF et WebP avec le véritable Sharp ; le build Next complet
valide l'intégration PostCSS/Tailwind. L'audit doit être relancé après toute mise à jour.

Sources des mainteneurs :
- https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp
- https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c
- https://sharp.pixelplumbing.com/changelog/v0.35.4/
'''
p.write_text(s)
