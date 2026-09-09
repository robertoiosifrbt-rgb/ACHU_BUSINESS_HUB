#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-unity}"
ART="$ROOT/Assets/ACHU/Art"
mkdir -p "$ART/Buildings" "$ART/Roads" "$ART/Vehicles" "$ART/UrbanProps" "$ART/Characters" "$ART/UserCars" "$ART/UserTrees"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Kenney suburban buildings + complete city road kit.
curl -fsSL https://github.com/petroulacl/fps-buildings-env-kit/archive/refs/heads/main.zip -o "$TMP/env.zip"
unzip -q "$TMP/env.zip" -d "$TMP/env"
ENV="$TMP/env/fps-buildings-env-kit-main"
cp -R "$ENV/buildings/kenney-city-kit-suburban/Models/FBX format/." "$ART/Buildings/"
cp -R "$ENV/props/kenney-city-kit-roads/Models/FBX format/." "$ART/Roads/"

# Kenney car kit.
curl -fsSL https://github.com/Arslan12216775/kenney_car-kit/archive/refs/heads/master.zip -o "$TMP/cars.zip"
unzip -q "$TMP/cars.zip" -d "$TMP/cars"
cp -R "$TMP/cars/kenney_car-kit-master/Models/FBX format/." "$ART/Vehicles/"

# User-supplied Designersoup cars and tree pack mirror already used by the web prototype.
curl -fsSL https://github.com/luisfillipedias/OHOMEMDEMETAS/archive/3b44f2ba45d980a95713394f1ef1a6803b3c921c.zip -o "$TMP/user.zip"
unzip -q "$TMP/user.zip" -d "$TMP/user"
USER="$TMP/user/OHOMEMDEMETAS-3b44f2ba45d980a95713394f1ef1a6803b3c921c/assets/models"
if [ -d "$USER/car/designersoup" ]; then cp -R "$USER/car/designersoup/." "$ART/UserCars/"; fi
if [ -d "$USER/trees/Trees" ]; then cp -R "$USER/trees/Trees/." "$ART/UserTrees/"; fi

echo "ACHU Unity assets ready"
echo "Buildings: $(find "$ART/Buildings" -type f -name '*.fbx' | wc -l) FBX"
echo "Roads: $(find "$ART/Roads" -type f -name '*.fbx' | wc -l) FBX"
echo "Vehicles: $(find "$ART/Vehicles" -type f -name '*.fbx' | wc -l) FBX"
echo "User cars: $(find "$ART/UserCars" -type f -name '*.fbx' | wc -l) FBX"
echo "User trees: $(find "$ART/UserTrees" -type f -name '*.fbx' | wc -l) FBX"
