using HorrorPlay.Street;
using UnityEngine;

namespace HorrorPlay.Art
{
    public static class StreetV2CompositionBuilder
    {
        private static readonly Color ColdHarbor = new(0.34f, 0.48f, 0.56f, 0.88f);
        private static readonly Color DeepHarbor = new(0.21f, 0.31f, 0.38f, 0.94f);
        private static readonly Color TownTint = new(0.37f, 0.39f, 0.42f, 1f);
        private static readonly Color TimberTint = new(0.42f, 0.30f, 0.27f, 1f);
        private static readonly Color WarmWindow = new(1f, 0.56f, 0.23f, 0.94f);
        private static readonly Color WetGround = new(0.24f, 0.31f, 0.34f, 1f);

        public static void Build(Transform distant, Transform farArchitecture, Transform facades, Transform gameplay, Transform foreground)
        {
            BuildHarbor(distant);
            BuildMidArchitecture(farArchitecture);
            BuildFacades(facades);
            BuildGround(gameplay);
            BuildForeground(foreground);
        }

        private static void BuildHarbor(Transform root)
        {
            StreetV2AssetLibrary.Sprite("HarborNightBack", root, StreetV2AssetLibrary.BackgroundResource, new Vector3(0f, 6.2f, 12f), new Vector3(2.7f, 2.7f, 1f), DeepHarbor, -100);
            StreetV2AssetLibrary.Sprite("HarborNightMiddle", root, StreetV2AssetLibrary.MidHarborResource, new Vector3(0f, 4.1f, 11.5f), new Vector3(3.3f, 3.3f, 1f), ColdHarbor, -90);
            StreetV2AssetLibrary.Sprite("HarborCloudBank", root, StreetV2AssetLibrary.CloudResource, new Vector3(0f, 8.1f, 10.5f), new Vector3(2.9f, 2.9f, 1f), new Color(0.30f, 0.39f, 0.43f, 0.38f), -80);
            StreetV2AssetLibrary.Sprite("HarborTower", root, "StreetV2/warped_night_tower", new Vector3(-12f, 4.4f, 10f), new Vector3(2.2f, 2.2f, 1f), new Color(0.27f, 0.38f, 0.43f, 0.72f), -70);
        }

        private static void BuildMidArchitecture(Transform root)
        {
            StreetV2AssetLibrary.Sprite("TownBackground", root, "StreetV2/gothic_background", new Vector3(0f, 5.7f, 8f), new Vector3(2.2f, 2.2f, 1f), new Color(0.27f, 0.31f, 0.35f, 0.94f), -40);
            StreetV2AssetLibrary.Sprite("TownMiddleground", root, "StreetV2/gothic_middleground", new Vector3(0f, 3.6f, 7f), new Vector3(2.2f, 2.2f, 1f), new Color(0.32f, 0.34f, 0.35f, 0.96f), -30);
        }

        private static void BuildFacades(Transform root)
        {
            StreetV2AssetLibrary.Sprite("WarehouseFacade", root, "StreetV2/gothic_house_a", new Vector3(-16.5f, 4.65f, 3.8f), new Vector3(0.82f, 0.82f, 1f), TownTint, 10);
            StreetV2AssetLibrary.Sprite("ResidentFacade", root, "StreetV2/gothic_house_c", new Vector3(-6.2f, 4.35f, 3.7f), new Vector3(0.76f, 0.76f, 1f), TimberTint, 12);
            StreetV2AssetLibrary.Sprite("TavernFacade", root, StreetV2AssetLibrary.TavernResource, new Vector3(15.7f, 4.7f, 3.4f), new Vector3(0.86f, 0.86f, 1f), new Color(0.52f, 0.34f, 0.27f, 1f), 14);

            StreetV2AssetLibrary.Sprite("TavernWindowLeft", root, "StreetV2/gothic_window", new Vector3(13.9f, 4.55f, 2.95f), new Vector3(0.82f, 0.82f, 1f), WarmWindow, 22);
            StreetV2AssetLibrary.Sprite("TavernWindowRight", root, "StreetV2/gothic_window_bars", new Vector3(17.9f, 4.55f, 2.95f), new Vector3(0.82f, 0.82f, 1f), WarmWindow, 22);
            StreetV2AssetLibrary.Sprite("TavernSign", root, "StreetV2/gothic_sign", new Vector3(15.9f, 6.65f, 2.7f), new Vector3(0.9f, 0.9f, 1f), new Color(0.63f, 0.39f, 0.25f, 1f), 25);
            StreetV2AssetLibrary.Sprite("WarehouseLamp", root, "StreetV2/gothic_lamp", new Vector3(-17.8f, 3.25f, 2.9f), new Vector3(0.9f, 0.9f, 1f), new Color(0.45f, 0.48f, 0.46f, 1f), 24);
            StreetV2AssetLibrary.Sprite("TavernLamp", root, "StreetV2/gothic_lamp", new Vector3(20.3f, 3.25f, 2.9f), new Vector3(0.9f, 0.9f, 1f), new Color(0.58f, 0.45f, 0.32f, 1f), 24);
        }

        private static void BuildGround(Transform root)
        {
            GameObject gameplaySurface = new GameObject("GameplaySurface");
            gameplaySurface.transform.SetParent(root, false);
            gameplaySurface.transform.localPosition = new Vector3(0f, -0.2f, 0f);
            BoxCollider surfaceCollider = gameplaySurface.AddComponent<BoxCollider>();
            surfaceCollider.size = new Vector3(StreetBootstrap.StreetWidth + 4f, 0.4f, 6f);

            for (int i = -14; i <= 14; i++)
            {
                StreetV2AssetLibrary.Sprite("WetGround_" + i, root, StreetV2AssetLibrary.GroundResource, new Vector3(i * 1.65f, -0.05f, 0.5f), new Vector3(1.7f, 1.7f, 1f), WetGround, 35);
            }

            StreetV2AssetLibrary.Sprite("GroundEdge", root, "StreetV2/gothic_ground_wall", new Vector3(0f, 0.8f, 1f), new Vector3(3f, 2f, 1f), new Color(0.26f, 0.29f, 0.30f, 1f), 36);
            StreetV2AssetLibrary.Sprite("GroundShadow", root, "StreetV2/gothic_ground_b", new Vector3(-3.5f, 0.16f, -0.5f), new Vector3(4.4f, 1.35f, 1f), new Color(0.19f, 0.25f, 0.27f, 0.84f), 38);
            StreetV2AssetLibrary.Sprite("TavernGroundReflection", root, "StreetV2/gothic_ground_b", new Vector3(15.2f, 0.13f, -0.55f), new Vector3(3.7f, 1.15f, 1f), new Color(0.42f, 0.31f, 0.24f, 0.60f), 39);
        }

        private static void BuildForeground(Transform root)
        {
            StreetV2AssetLibrary.Sprite("NearLamp", root, "StreetV2/gothic_lamp", new Vector3(-22f, 2.9f, -2.4f), new Vector3(1.5f, 1.5f, 1f), new Color(0.16f, 0.21f, 0.23f, 0.92f), 80);
            StreetV2AssetLibrary.Sprite("NearSign", root, "StreetV2/gothic_sign", new Vector3(8.5f, 3.1f, -2.1f), new Vector3(1.1f, 1.1f, 1f), new Color(0.19f, 0.23f, 0.25f, 0.85f), 82);
            StreetV2AssetLibrary.Sprite("NearCrateStack", root, "StreetV2/gothic_crate_stack", new Vector3(7.2f, 0.75f, -2f), new Vector3(1.25f, 1.25f, 1f), new Color(0.28f, 0.23f, 0.22f, 0.94f), 78);
            StreetV2AssetLibrary.Sprite("NearBarrel", root, "StreetV2/gothic_barrel", new Vector3(-2.8f, 0.65f, -2.2f), new Vector3(1.1f, 1.1f, 1f), new Color(0.24f, 0.25f, 0.25f, 0.96f), 79);
        }
    }
}
