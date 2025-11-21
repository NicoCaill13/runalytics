Voici ta roadmap **Runalytics** propre, nette, prête à copier-coller dans Notion / GitHub / Confluence.
Format **Markdown**, ultra clair.

---

# 🗺️ Roadmap Runalytics

### *Training Intelligence Engine*

Format : **MVP → V1 → V2**

---

# 🚀 MVP (4 semaines) — *Analyse & Feedback intelligent*

### 🎯 Objectif :

Créer un moteur qui **analyse les séances**, **comprend le coureur**, et **donne un feedback intelligent**.
Aucun plan, aucune séance générée.

---

## ✅ Fonctionnalités MVP

### 1. **Import Strava**

* OAuth2 Strava
* Récupération automatique des activités running
* Stockage + parsing (pace, FC, FC max, FC moyenne, distance, temps)

### 2. **Définition d’objectifs**

* 5 km / 10 km / Semi / Marathon
* Champs : `date`, `targetTime`, `isPrimary`, `active`, `completed`, `success`

### 3. **Analyse automatique des 30 derniers jours**

* Ratio EF / Intensité
* Distribution Z1–Z5 (Karvonen)
* Analyse de dérive cardiaque (EF Drift)
* Charge hebdomadaire
* Variation de charge (monotony / strain)
* Allure EF réelle
* Estimation VO2max interne (pas Garmin)

### 4. **Scores intelligents**

* Score Intensité
* Score Régularité
* Score Cohérence Objectif
* Score Fatigue (basé FC + charge)

### 5. **Feedback automatique**

* Feedback après chaque semaine
* Détection des problèmes :

  * Sur-intensité Z3
  * Dérive excessive
  * Charge trop forte
  * EF trop rapide/lente
* Suggestions :

  * “Ralentir EF”
  * “Augmenter volume EF”
  * “Réduire intensité prochaine séance”

### 6. **Dashboard MVP**

* Courbe volume / semaine
* Répartition Z1–Z5
* Évolution allure EF
* “Readiness score” simplifié
* Vue des objectifs + projection simple

---

# 🟦 V1 (3 mois) — *Coaching adaptatif*

### 🎯 Objectif :

Commencer à **guider** le coureur avec un plan *adaptatif* basé sur son corps et ses objectifs.
Pas un plan “Campus”.
Un plan intelligent basé sur blocs d'intensité.

---

## ✅ Fonctionnalités V1

### 1. **Multi-objectifs avancé**

* Plusieurs objectifs actifs
* Priorisation automatique
* Détection des conflits (ex. Marathon + 5km simultané)
* Ratio EF / Qualité ajusté selon priorité

### 2. **Blocs intelligents (pas des séances complètes)**

* EF court
* EF long
* Tempo
* Seuil
* Intervalle court
* Repos / récupération
  → L’algorithme génère **le type de séance**, pas le détail.

### 3. **Adaptation dynamique**

* Upgrade/downgrade automatique selon :

  * FC trop haute
  * Z3 excessive
  * Charge monotone
  * Fatigue latente
* Ajustement semaine par semaine

### 4. **Scores avancés**

* Score Forme
* Score Fatigue approfondi
* Score Endurance
* Score Robustesse

### 5. **Simulation chrono dynamique**

* Projection 5K / 10K / semi / marathon
* Mise à jour après chaque semaine
* Basée sur FC, drift, allure EF, progression

### 6. **Feedback hebdomadaire complet**

* Volume
* Intensité
* Zones perso
* Points forts / points faibles
* Ajustements recommandés
* Projection chrono mise à jour
* Plan logique pour la semaine suivante

---

# 🟧 V2 (6–12 mois) — *Coaching complet intelligent + biomécanique*

### 🎯 Objectif :

Construire **le moteur d’entraînement le plus intelligent du marché**, intégrant métriques avancées, HRV, biomécanique, et génération complète de plan.

---

## ✅ Fonctionnalités V2

### 1. **Analyse biomécanique avancée**

Import des métriques avancées (Garmin, Coros, Apple) :

* Cadence
* Oscillation verticale
* Ground contact
* Balance
* Vertical ratio
* Détection de problèmes de foulée

### 2. **HRV & Fatigue totale**

* Import HRV (Garmin / Fitbit / Oura / Google Health)
* Système fatigue/fraîcheur automatisé
* Ajustement du plan basé sur physiological stress

### 3. **Multi-sourcing complet**

* Garmin
* Coros
* Suunto
* Polar
* Apple Health / Google Health
  (avec proxy mobile si nécessaire)

### 4. **Plan complet généré intelligemment**

* 100 % personnalisé
* Intégration des contraintes perso (jours dispo, préférences, limitations)
* Ajustement quotidien ou hebdomadaire
* Cohérence multi-objectifs
* Réajustements selon charge + fatigue réelle

### 5. **Profil complet du coureur**

* Profil intensité
* Profil endurance
* Profil vitesse
* Profil dérive FC
* Profil biomécanique
  → “Les points faibles du runner” (unique sur le marché)

### 6. **Stratégie de course intelligente**

* Allures cibles
* Gestion de la FC
* Plan de pacing personnalisé
* Scénarios : “agressif”, “conservateur”, “progressif”

---

# 🏗️ Architecture technique (résumé)

**Frontend**

* Next.js 15
* Tailwind
* React Query
* NextAuth (Strava provider)

**Backend**

* NestJS
* Prisma
* PostgreSQL
* Cron hebdomadaire
* Module Analytics
* Module Objectives
* Module Activities

**Data / ML**

* Analyse déterministe
* ML léger en V2 pour projection chrono
* Jobs asynchrones (BullMQ ou Quartz)

---

# ⛔ Kill Features (à ne JAMAIS faire)

* Coaching audio
* Social (kudos, likes)
* Marketplace d’entraînements
* Plans “génériques” type Campus
* Musculation / renfo dans l'app
* Interface complexe type TrainingPeaks
* Gamification excessive
* Badges / trophées
* Graphiques inutiles

Runalytics = **data + intelligence + simplicité**.

---

Si tu veux, je peux maintenant générer :
📌 la version Notion (avec toggles, icônes, sections)
📌 la timeline Gantt
📌 la version “Product Vision Deck” (slides)
📌 la roadmap technique détaillée (dossiers, modules, services)

Tu veux quoi ensuite ?
