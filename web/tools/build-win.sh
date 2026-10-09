#!/usr/bin/env bash
# Builds web/dist/ElHuesped.exe: the single-file game inside a small launcher (windows/Launcher.cs)
# that opens it in an Edge app window. Only the .NET Framework compiler that ships with Windows.
#   bash web/tools/build-win.sh            (ElHuesped.exe --windowed opens it in a window)
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION="${VERSION:-1.0-rc}"
NUM="$(echo "$VERSION" | grep -o '^[0-9.]*')"; RC="$(echo "$VERSION" | grep -o '[0-9]*$' || echo 0)"
CSC="/c/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe"
OUT=dist/win
rm -rf "$OUT"; mkdir -p "$OUT"

echo "· juego"
npx --yes esbuild src/main.js --bundle --format=iife --minify --log-level=warning --outfile="$OUT/bundle.js"
python tools/build-artifact.py "$OUT/index.html" --apk
rm "$OUT/bundle.js"

echo "· icono"
python -c "from PIL import Image; Image.open('android/res/mipmap-xxxhdpi/ic_launcher.png').convert('RGBA').save('$OUT/icon.ico', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(192,192)])"

echo "· exe"
cat > "$OUT/Version.cs" <<EOF
[assembly: System.Reflection.AssemblyVersion("$NUM.$RC.0")]
[assembly: System.Reflection.AssemblyTitle("El Huésped")]
[assembly: System.Reflection.AssemblyProduct("El Huésped $VERSION")]
EOF
"$CSC" -nologo -target:winexe -optimize -codepage:65001 -out:"$(cygpath -w "dist/ElHuesped.exe")" \
  -win32icon:"$(cygpath -w "$OUT/icon.ico")" -resource:"$(cygpath -w "$OUT/index.html")",index.html \
  -r:System.Windows.Forms.dll "$(cygpath -w windows/Launcher.cs)" "$(cygpath -w "$OUT/Version.cs")"
ls -la dist/ElHuesped.exe
