# GitHub Actions Workflows

Ce dossier contient les workflows GitHub Actions pour Kaya.

## Workflows

### 🔄 CI (`ci.yml`)

**Déclenché sur** : Push/PR sur `main` ou `develop`

**Durée estimée** : ~2-3 minutes

**Jobs** :

- ✅ Code Quality (formatting, type-check, tests)
- ✅ Build web app
- ⚠️ Build desktop (seulement sur tags ou manuel)

**Optimisations** :

- Cache des dépendances Bun et Rust
- Web build dans le même job que quality
- Desktop build désactivé par défaut (coûteux)

### 🚀 Release (`release.yml`)

**Déclenché sur** :

- Tags `v*` (ex: `v0.1.0`)
- Manuel (workflow_dispatch)

**Durée estimée** : ~15-20 minutes

**Jobs** :

- Build desktop pour Ubuntu, macOS, Windows
- Création de release GitHub avec artifacts

## Stratégie de coûts

### Repo privé GitHub Actions

**Coût mensuel** : Gratuit jusqu'à 2000 minutes/mois, puis $0.008/minute

**Avant optimisation** :

```
Push sur main:
- Quality: ~2 min
- Build web: ~1 min
- Build desktop (3 OS): ~15 min chacun = 45 min
Total: ~48 minutes par push
```

**Après optimisation** :

```
Push sur main:
- Quality + web: ~3 min
Total: ~3 minutes par push (96% de réduction !)

Release (occasionnel):
- Build 3 OS: ~15-20 min
```

### Économies estimées

**10 pushs/semaine avant** : 480 min/semaine = 1920 min/mois → Gratuit  
**10 pushs/semaine après** : 30 min/semaine = 120 min/mois → **Bien en dessous de la limite gratuite**

**Releases** : 2-3/mois × 20 min = 40-60 min/mois

**Total** : ~180 min/mois → **90% sous la limite gratuite** ✅

## Utilisation

### Push normal (dev)

```bash
git add .
git commit -m "feat: add feature"
git push
```

→ Seulement quality + web (~3 min)

### Créer une release

**Option 1 - Via tag** :

```bash
git tag v0.1.0
git push origin v0.1.0
```

**Option 2 - Manuelle** :

- Aller dans Actions → Release → Run workflow

→ Build toutes les plateformes (~20 min)

## Configuration locale

Pour tester le build desktop localement :

```bash
# Ubuntu/Mac/Windows
bun run tauri:build
```

## Cache

Les workflows utilisent le cache pour :

- Dependencies Bun (`node_modules`)
- Registry Cargo (Rust)
- Build artifacts Tauri

Le cache est invalidé quand :

- `bun.lockb` change (dépendances JS)
- `Cargo.lock` change (dépendances Rust)

## Monitoring

Surveiller dans Actions :

- ⏱️ Durée des jobs
- 💰 Minutes utilisées (Settings → Billing)
- ❌ Échecs de build

## Maintenance

### Mettre à jour Bun

Modifier `BUN_VERSION` dans les workflows :

```yaml
env:
  BUN_VERSION: '1.3.2' # Changer ici
```

### Ajouter une plateforme

Éditer `release.yml` :

```yaml
matrix:
  platform: [ubuntu-latest, macos-latest, windows-latest, ubuntu-arm64]
```

---

**Dernière mise à jour** : 9 novembre 2025
