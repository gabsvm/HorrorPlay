// El Huésped for Windows: a single exe that carries the whole game (the same one-file build as the
// APK) as a resource, unpacks it under %LOCALAPPDATA%\ElHuesped and opens it in an Edge app window,
// fullscreen, with a profile of its own so saves and options persist. Edge ships with Windows 11.
// Built by tools/build-win.sh with the .NET Framework compiler; no SDK, no downloads.
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;

static class Launcher {
  [STAThread]
  static void Main(string[] args) {
    try {
      string home = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ElHuesped");
      string game = Path.Combine(home, "game");
      Directory.CreateDirectory(game);
      string page = Path.Combine(game, "index.html");
      string stamp = Path.Combine(game, "version.txt");
      string version = Assembly.GetExecutingAssembly().GetName().Version.ToString() + "/" +
        File.GetLastWriteTimeUtc(Assembly.GetExecutingAssembly().Location).Ticks;
      if (!File.Exists(page) || !File.Exists(stamp) || File.ReadAllText(stamp) != version) {
        using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("index.html"))
        using (FileStream f = File.Create(page)) s.CopyTo(f);
        File.WriteAllText(stamp, version);
      }

      string edge = FindEdge();
      if (edge == null) {
        MessageBox.Show("Hace falta Microsoft Edge para jugar.", "El Huésped", MessageBoxButtons.OK, MessageBoxIcon.Error);
        return;
      }
      bool windowed = Array.IndexOf(args, "--windowed") >= 0;
      string url = new Uri(page).AbsoluteUri;
      string flags = "--app=\"" + url + "\" --user-data-dir=\"" + Path.Combine(home, "profile") + "\"" +
        " --no-first-run --no-default-browser-check --disable-features=Translate,msEdgeSidebarV2" +
        " --autoplay-policy=no-user-gesture-required --allow-file-access-from-files" +
        (windowed ? " --window-size=1280,760" : " --start-fullscreen");
      Process.Start(new ProcessStartInfo(edge, flags) { UseShellExecute = false });
    } catch (Exception e) {
      MessageBox.Show(e.Message, "El Huésped", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
  }

  static string FindEdge() {
    foreach (RegistryKey root in new[] { Registry.LocalMachine, Registry.CurrentUser }) {
      using (RegistryKey k = root.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe")) {
        string p = k == null ? null : k.GetValue("") as string;
        if (p != null && File.Exists(p)) return p;
      }
    }
    foreach (Environment.SpecialFolder f in new[] { Environment.SpecialFolder.ProgramFilesX86, Environment.SpecialFolder.ProgramFiles }) {
      string p = Path.Combine(Environment.GetFolderPath(f), @"Microsoft\Edge\Application\msedge.exe");
      if (File.Exists(p)) return p;
    }
    return null;
  }
}
