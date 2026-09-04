using HorrorPlay.Art;
using HorrorPlay.Atmosphere;
using HorrorPlay.CameraSystem;
using HorrorPlay.Input;
using HorrorPlay.Interaction;
using HorrorPlay.Narrative;
using HorrorPlay.Player;
using HorrorPlay.UI;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace HorrorPlay.Street
{
    public sealed class StreetBootstrap : MonoBehaviour
    {
        public const float StreetMinX = -24f;
        public const float StreetMaxX = 24f;
        public const float StreetWidth = 48f;
        public const string NoticeHotspotId = "harbor_closure_notice";
        public const string ResidentHotspotId = "local_resident";
        public const string TavernHotspotId = "tavern_door";

        private bool built;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureRuntimeRoot()
        {
            if (SceneManager.GetActiveScene().name != "InnsmouthStreet") return;
            if (FindFirstObjectByType<StreetBootstrap>() == null)
            {
                new GameObject("StreetBootstrap").AddComponent<StreetBootstrap>();
            }
        }

        private void Awake()
        {
            if (!built) BuildStreet();
        }

        private void BuildStreet()
        {
            built = true;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.055f, 0.085f, 0.095f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = StreetPalette.PetroleumShadow;
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogStartDistance = 18f;
            RenderSettings.fogEndDistance = 42f;

            Material sky = StreetMaterialFactory.Lit("Sky", StreetPalette.NearBlackBlue);
            Material far = StreetMaterialFactory.Lit("FarArchitecture", StreetPalette.PetroleumShadow);
            Material stone = StreetMaterialFactory.Lit("WetStone", StreetPalette.ColdStructure, 0.26f);
            Material wet = StreetMaterialFactory.Lit("WetStreet", StreetPalette.WetNeutral, 0.72f);
            Material wood = StreetMaterialFactory.Lit("DampWood", StreetPalette.WarmWoodShadow, 0.12f);
            Material metal = StreetMaterialFactory.Lit("OxidizedMetal", StreetPalette.ColdStructure * 0.78f, 0.32f, 0.18f);
            Material brass = StreetMaterialFactory.Lit("AgedBrass", StreetPalette.AgedBrass, 0.38f, 0.35f);
            Material warmGlass = StreetMaterialFactory.Lit("WarmGlass", StreetPalette.WarmWoodShadow, 0.55f, 0f, StreetPalette.Tungsten, 2.2f);
            Material darkGlass = StreetMaterialFactory.Lit("DarkGlass", StreetPalette.PetroleumShadow, 0.5f);

            Transform distant = Group("01_DistantHarbor");
            Transform farArchitecture = Group("02_FarArchitecture");
            Transform facades = Group("03_PrimaryFacades");
            Transform gameplay = Group("04_GameplayPlane");
            Transform foreground = Group("05_ForegroundAtmosphere");

            StreetGeometryFactory.Box("NightMass", distant, new Vector3(0f, 6f, 12f), new Vector3(70f, 18f, 0.5f), sky);
            BuildHarborSilhouettes(distant, far);
            BuildFarTown(farArchitecture, far, darkGlass);
            BuildFacades(facades, stone, wood, metal, brass, warmGlass, darkGlass);

            GameObject walk = StreetGeometryFactory.Box("WalkStrip", gameplay, new Vector3(0f, -0.28f, 0f), new Vector3(StreetWidth + 4f, 0.5f, 5.5f), wet, true);
            walk.layer = 0;
            BuildPuddles(gameplay, warmGlass, darkGlass);

            Transform inspector = BuildInspector(gameplay, wood, metal, brass);
            var mover = inspector.gameObject.AddComponent<InspectorMover>();
            mover.ConfigureBounds(StreetMinX, StreetMaxX);
            mover.ConfigureVisualRoot(inspector.Find("Visual"));

            var cameraGo = new GameObject("StreetCamera");
            var camera = cameraGo.AddComponent<UnityEngine.Camera>();
            camera.fieldOfView = 43f;
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 80f;
            camera.transform.position = new Vector3(0f, 6f, -18f);
            camera.transform.rotation = Quaternion.Euler(8f, 0f, 0f);
            camera.backgroundColor = StreetPalette.NearBlackBlue;
            var cameraController = cameraGo.AddComponent<StreetCameraController>();
            cameraController.Configure(inspector, -17.5f, 17.5f, 6f, -18f, 0.32f);

            BuildLighting(facades);
            var dialogue = SimpleDialoguePresenter.CreateRuntimeUI();
            var atmosphere = gameObject.AddComponent<StreetAtmosphere>();
            atmosphere.Build(foreground, cameraController);
            var narrative = gameObject.AddComponent<StreetNarrativeDirector>();
            narrative.Configure(atmosphere);

            CreateHotspots(gameplay, dialogue, narrative, wood, brass, warmGlass);
            var pointer = gameObject.AddComponent<PointerInteractor>();
            pointer.Configure(camera, mover);
            BuildForeground(foreground, metal, wood);
        }

        private Transform Group(string name)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            return go.transform;
        }

        private static void BuildHarborSilhouettes(Transform root, Material material)
        {
            StreetGeometryFactory.Box("SeaBand", root, new Vector3(-15f, 0.5f, 10f), new Vector3(30f, 1f, 1f), material);
            for (int i = 0; i < 8; i++)
            {
                float x = -30f + i * 8f;
                StreetGeometryFactory.Box("HarborMass_" + i, root, new Vector3(x, 2.8f + (i % 3), 9f), new Vector3(4f + (i % 2), 5f + (i % 3), 1.8f), material);
            }
        }

        private static void BuildFarTown(Transform root, Material material, Material glass)
        {
            for (int i = 0; i < 9; i++)
            {
                float x = -27f + i * 6.7f;
                float h = 5.5f + (i % 4) * 0.8f;
                StreetGeometryFactory.Box("FarHouse_" + i, root, new Vector3(x, h * 0.5f, 6.2f), new Vector3(5.7f, h, 2.6f), material);
                if (i % 3 == 1) StreetGeometryFactory.Window(root, new Vector3(x + 0.7f, h * 0.62f, 4.84f), new Vector2(0.55f, 0.8f), material, glass);
            }
        }

        private static void BuildFacades(Transform root, Material stone, Material wood, Material metal, Material brass, Material warmGlass, Material darkGlass)
        {
            StreetGeometryFactory.Box("HarborWarehouse", root, new Vector3(-18f, 3.4f, 3.3f), new Vector3(10f, 6.8f, 4f), stone);
            StreetGeometryFactory.Window(root, new Vector3(-20.2f, 4.2f, 1.26f), new Vector2(1.1f, 1.25f), metal, darkGlass);
            StreetGeometryFactory.Window(root, new Vector3(-16.4f, 4.2f, 1.26f), new Vector2(1.1f, 1.25f), metal, darkGlass);

            StreetGeometryFactory.Box("AlleyHouse", root, new Vector3(-7f, 3.8f, 3.6f), new Vector3(7f, 7.6f, 4.3f), wood);
            StreetGeometryFactory.Window(root, new Vector3(-7.8f, 4.7f, 1.40f), new Vector2(0.8f, 1.15f), metal, warmGlass);

            StreetGeometryFactory.Box("CentralBlock", root, new Vector3(3.5f, 4.2f, 3.2f), new Vector3(12f, 8.4f, 4f), stone);
            StreetGeometryFactory.Window(root, new Vector3(1.2f, 5.3f, 1.15f), new Vector2(0.9f, 1.2f), metal, darkGlass);
            StreetGeometryFactory.Window(root, new Vector3(5.3f, 5.3f, 1.15f), new Vector2(0.9f, 1.2f), metal, warmGlass);

            StreetGeometryFactory.Box("Tavern", root, new Vector3(16.5f, 3.6f, 3f), new Vector3(10f, 7.2f, 4f), wood);
            StreetGeometryFactory.Window(root, new Vector3(14.2f, 4.5f, 0.94f), new Vector2(1.4f, 1.35f), brass, warmGlass);
            StreetGeometryFactory.Window(root, new Vector3(18.4f, 4.5f, 0.94f), new Vector2(1.4f, 1.35f), brass, warmGlass);
            StreetGeometryFactory.Box("BlockedTownContinuation", root, new Vector3(27.5f, 3.1f, 3.8f), new Vector3(8f, 6.2f, 4.8f), stone);
        }

        private static void BuildPuddles(Transform root, Material warm, Material cold)
        {
            StreetGeometryFactory.Box("ColdPuddle", root, new Vector3(-3f, 0.015f, -0.7f), new Vector3(7f, 0.025f, 1.2f), cold);
            StreetGeometryFactory.Box("TavernPuddle", root, new Vector3(14.5f, 0.018f, -0.4f), new Vector3(5.8f, 0.025f, 0.9f), warm);
        }

        private static Transform BuildInspector(Transform root, Material coat, Material metal, Material brass)
        {
            var inspector = new GameObject("Inspector");
            inspector.transform.SetParent(root, false);
            inspector.transform.localPosition = new Vector3(-20f, 1.45f, -0.35f);
            var visual = new GameObject("Visual");
            visual.transform.SetParent(inspector.transform, false);
            StreetGeometryFactory.Cylinder("Coat", visual.transform, new Vector3(0f, 0f, 0f), new Vector3(0.48f, 1.25f, 0.35f), coat);
            StreetGeometryFactory.Box("Shoulders", visual.transform, new Vector3(0f, 0.9f, 0f), new Vector3(1.0f, 0.22f, 0.42f), coat);
            StreetGeometryFactory.Box("HatBrim", visual.transform, new Vector3(0f, 1.65f, 0f), new Vector3(1.15f, 0.12f, 0.52f), metal);
            StreetGeometryFactory.Box("HatCrown", visual.transform, new Vector3(0f, 1.86f, 0f), new Vector3(0.72f, 0.36f, 0.48f), metal);
            StreetGeometryFactory.Box("Badge", visual.transform, new Vector3(0.27f, 0.7f, -0.22f), new Vector3(0.13f, 0.13f, 0.04f), brass);
            return inspector.transform;
        }

        private static void BuildLighting(Transform root)
        {
            var moonGo = new GameObject("ColdMoonFill");
            moonGo.transform.SetParent(root, false);
            var moon = moonGo.AddComponent<Light>();
            moon.type = LightType.Directional;
            moon.color = new Color(0.42f, 0.55f, 0.62f);
            moon.intensity = 0.42f;
            moonGo.transform.rotation = Quaternion.Euler(42f, -28f, 0f);

            AddWarmLight(root, new Vector3(-7.8f, 4.3f, 0.5f), 4.5f, 2.1f);
            AddWarmLight(root, new Vector3(16.2f, 3.1f, -0.1f), 7f, 3.0f);
        }

        private static void AddWarmLight(Transform parent, Vector3 position, float range, float intensity)
        {
            var go = new GameObject("LocalizedTungsten");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            var light = go.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = StreetPalette.Tungsten;
            light.range = range;
            light.intensity = intensity;
        }

        private static void CreateHotspots(Transform root, SimpleDialoguePresenter dialogue, StreetNarrativeDirector narrative, Material wood, Material brass, Material warmGlass)
        {
            var noticeAnchor = new GameObject("NoticeAnchor"); noticeAnchor.transform.SetParent(root, false); noticeAnchor.transform.localPosition = new Vector3(-14.4f, 0f, -0.6f);
            GameObject noticeGo = StreetGeometryFactory.Box("HarborClosureNotice", root, new Vector3(-14.4f, 1.45f, -0.3f), new Vector3(1.7f, 2.2f, 0.18f), wood, true);
            var notice = noticeGo.AddComponent<WorldHotspot>();
            notice.Configure(NoticeHotspotId, "Leer cierre del puerto", noticeAnchor.transform, 2.4f, true, true);
            notice.Activated += _ => { dialogue.Show("AVISO MUNICIPAL", "PUERTO CERRADO — 12 OCT 1926. La Unidad 317 no fue declarada desaparecida hasta el 14. ¿Por qué cerraron el puerto dos días antes?", 6.5f); narrative.MarkNoticeRead(); };

            var residentAnchor = new GameObject("ResidentAnchor"); residentAnchor.transform.SetParent(root, false); residentAnchor.transform.localPosition = new Vector3(-6.3f, 0f, -0.6f);
            GameObject residentGo = StreetGeometryFactory.Box("LocalResident", root, new Vector3(-6.3f, 1.25f, -0.15f), new Vector3(0.8f, 2.5f, 0.55f), wood, true);
            var resident = residentGo.AddComponent<WorldHotspot>();
            resident.Configure(ResidentHotspotId, "Hablar", residentAnchor.transform, 2.5f, true, false);
            resident.Activated += _ => { dialogue.Show("HOMBRE DE INNSMOUTH", "Si el agua dice su nombre, inspector... siga caminando. No le conteste.", 5.5f); narrative.MarkResidentSpoken(); };

            var tavernAnchor = new GameObject("TavernAnchor"); tavernAnchor.transform.SetParent(root, false); tavernAnchor.transform.localPosition = new Vector3(16.6f, 0f, -0.5f);
            GameObject doorGo = StreetGeometryFactory.Box("TavernDoor", root, new Vector3(16.6f, 1.7f, 0.55f), new Vector3(1.8f, 3.4f, 0.22f), warmGlass, true);
            var tavern = doorGo.AddComponent<WorldHotspot>();
            tavern.Configure(TavernHotspotId, "Entrar a la taberna", tavernAnchor.transform, 2.6f, true, false);
            tavern.Activated += _ => dialogue.Show("INSPECTOR", "La taberna será la próxima habitación. Esta V1 termina en esta puerta.", 4.5f);
        }

        private static void BuildForeground(Transform root, Material metal, Material wood)
        {
            for (int i = 0; i < 4; i++)
            {
                float x = -21f + i * 14f;
                StreetGeometryFactory.Cylinder("ForegroundPost_" + i, root, new Vector3(x, 2.2f, -2.2f), new Vector3(0.12f, 2.2f, 0.12f), metal);
            }
            StreetGeometryFactory.Box("NearCrates", root, new Vector3(7f, 0.65f, -2f), new Vector3(2.8f, 1.3f, 1.2f), wood);
        }
    }
}
