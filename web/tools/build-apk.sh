#!/usr/bin/env bash
# Builds web/dist/el-huesped.apk from the single-file game, with only the Android SDK build-tools
# and a JDK: no Gradle, no downloads. Signed with a local debug key (web/android/debug.keystore,
# created on first run, not committed).
#   bash web/tools/build-apk.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$LOCALAPPDATA/Android/Sdk}}"
SDK="$(cygpath -u "$SDK" 2>/dev/null || echo "$SDK")"
BT="$SDK/build-tools/$(ls "$SDK/build-tools" | sort -V | tail -1)"
PLAT="$SDK/platforms/android-35/android.jar"
EXE=""; [ -f "$BT/aapt2.exe" ] && EXE=".exe"
BAT=""; [ -f "$BT/d8.bat" ] && BAT=".bat"
VERSION="${VERSION:-1.0-rc}"
OUT=dist/apk
rm -rf "$OUT"; mkdir -p "$OUT/assets" "$OUT/gen" "$OUT/obj" "$OUT/res"

echo "· juego"
npx --yes esbuild src/main.js --bundle --format=iife --minify --log-level=warning --outfile="$OUT/assets/bundle.js"
python tools/build-artifact.py "$OUT/assets/index.html" --apk
rm "$OUT/assets/bundle.js"

echo "· recursos"
"$BT/aapt2$EXE" compile --dir android/res -o "$OUT/res/res.zip"
"$BT/aapt2$EXE" link -o "$OUT/base.apk" -I "$PLAT" --manifest android/AndroidManifest.xml \
  -A "$OUT/assets" --java "$OUT/gen" "$OUT/res/res.zip" \
  --min-sdk-version 24 --target-sdk-version 35 --version-code 1 --version-name "$VERSION"

echo "· código"
javac -nowarn -source 1.8 -target 1.8 -classpath "$PLAT" -d "$OUT/obj" \
  $(find android/src "$OUT/gen" -name '*.java') 2>&1 | grep -v "^warning\|^Note\|bootstrap" || true
"$BT/d8$BAT" --lib "$PLAT" --min-api 24 --output "$OUT" $(find "$OUT/obj" -name '*.class')
(cd "$OUT" && jar uf base.apk classes.dex)

echo "· firma"
KS=android/debug.keystore
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -storepass android -keypass android -alias elhuesped \
  -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=El Huesped, O=gabsvm" >/dev/null 2>&1
"$BT/zipalign$EXE" -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"
"$BT/apksigner$BAT" sign --ks "$KS" --ks-pass pass:android --key-pass pass:android --out dist/el-huesped.apk "$OUT/aligned.apk"
"$BT/apksigner$BAT" verify dist/el-huesped.apk
ls -la dist/el-huesped.apk
