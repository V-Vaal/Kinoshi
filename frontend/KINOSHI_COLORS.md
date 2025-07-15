# Palette de couleurs Kinoshi

## Approche

Au lieu d'utiliser une palette personnalisée dans `tailwind.config.ts` qui peut poser des problèmes, nous utilisons des **variables CSS personnalisées** définies dans `app/globals.css`.

## Variables disponibles

```css
:root {
  --kinoshi-primary: #61a291; /* Vert principal */
  --kinoshi-gold: #e5deb9; /* Or/doré */
  --kinoshi-background: #f5f3ed; /* Arrière-plan */
  --kinoshi-surface: #fafaf7; /* Surface des cartes */
  --kinoshi-text: #232323; /* Texte principal */
  --kinoshi-muted: #a6a6a6; /* Texte atténué */
  --kinoshi-border: #e5deb9; /* Bordures */
  --kinoshi-danger: #e94f4f; /* Danger/erreur */
  --kinoshi-success: #b7d6c1; /* Succès */
}
```

## Utilisation dans Tailwind

Utilisez la syntaxe `bg-[var(--kinoshi-surface)]` au lieu de `bg-kinoshi-surface` :

```tsx
// ❌ Ancienne approche (ne fonctionne pas)
<div className="bg-kinoshi-surface text-kinoshi-text">

// ✅ Nouvelle approche (fonctionne)
<div className="bg-[var(--kinoshi-surface)] text-[var(--kinoshi-text)]">
```

## Exemples d'utilisation

### Arrière-plans

```tsx
className = 'bg-[var(--kinoshi-surface)]' // Surface
className = 'bg-[var(--kinoshi-background)]' // Arrière-plan
className = 'bg-[var(--kinoshi-primary)]' // Couleur principale
```

### Texte

```tsx
className = 'text-[var(--kinoshi-text)]' // Texte principal
className = 'text-[var(--kinoshi-muted)]' // Texte atténué
className = 'text-[var(--kinoshi-primary)]' // Texte principal
```

### Bordures

```tsx
className = 'border-[var(--kinoshi-border)]' // Bordure standard
className = 'border-[var(--kinoshi-gold)]' // Bordure dorée
```

### Avec opacité

```tsx
className = 'bg-[var(--kinoshi-primary)]/10' // 10% d'opacité
className = 'border-[var(--kinoshi-gold)]/60' // 60% d'opacité
```

## Avantages de cette approche

1. **Fiabilité** : Les variables CSS fonctionnent toujours
2. **Flexibilité** : Facile de modifier les couleurs
3. **Performance** : Pas de génération de classes Tailwind supplémentaires
4. **Maintenabilité** : Centralisé dans `globals.css`

## Migration

Tous les composants ont été migrés pour utiliser cette nouvelle approche :

- `KinoshiCard`
- `KinoshiButton`
- `KinoshiBadge`
- `Dashboard`
- `Layout`
- `Header`
- `page.tsx`
