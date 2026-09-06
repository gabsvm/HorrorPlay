using System;
using System.Collections.Generic;
using UnityEngine;

namespace HorrorPlay.Art
{
    public static class StreetV2AssetLibrary
    {
        public const string BackgroundResource = "StreetV2/warped_night_back";
        public const string MidHarborResource = "StreetV2/warped_night_middle";
        public const string CloudResource = "StreetV2/warped_night_clouds";
        public const string TavernResource = "StreetV2/gothic_house_b";
        public const string GroundResource = "StreetV2/gothic_ground";

        public static readonly IReadOnlyList<string> RequiredResources = new[]
        {
            BackgroundResource,
            MidHarborResource,
            CloudResource,
            TavernResource,
            GroundResource,
            "StreetV2/warped_night_tile",
            "StreetV2/warped_night_tower",
            "StreetV2/gothic_background",
            "StreetV2/gothic_middleground",
            "StreetV2/gothic_house_a",
            "StreetV2/gothic_house_c",
            "StreetV2/gothic_lamp",
            "StreetV2/gothic_sign",
            "StreetV2/gothic_crate_stack",
            "StreetV2/gothic_barrel",
            "StreetV2/gothic_ground_b",
            "StreetV2/gothic_ground_wall",
            "StreetV2/gothic_window",
            "StreetV2/gothic_window_bars",
            "StreetV2/gothic_oldman"
        };

        private static readonly Dictionary<string, Sprite> SpriteCache = new();

        public static Sprite LoadSprite(string resourcePath, float pixelsPerUnit = 16f)
        {
            if (SpriteCache.TryGetValue(resourcePath, out Sprite cached)) return cached;

            Texture2D texture = Resources.Load<Texture2D>(resourcePath);
            if (texture == null)
            {
                throw new MissingReferenceException($"Street V2 resource was not found: Resources/{resourcePath}.png");
            }

            Sprite sprite = Sprite.Create(
                texture,
                new Rect(0f, 0f, texture.width, texture.height),
                new Vector2(0.5f, 0.5f),
                pixelsPerUnit,
                0,
                SpriteMeshType.FullRect);
            sprite.name = resourcePath.Replace('/', '_');
            SpriteCache.Add(resourcePath, sprite);
            return sprite;
        }

        public static GameObject Sprite(
            string name,
            Transform parent,
            string resourcePath,
            Vector3 position,
            Vector3 scale,
            Color tint,
            int sortingOrder,
            bool collider = false,
            float pixelsPerUnit = 16f)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;

            SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = LoadSprite(resourcePath, pixelsPerUnit);
            renderer.color = tint;
            renderer.sortingOrder = sortingOrder;

            if (collider)
            {
                BoxCollider box = go.AddComponent<BoxCollider>();
                box.size = new Vector3(renderer.sprite.bounds.size.x, renderer.sprite.bounds.size.y, 0.25f);
                box.center = Vector3.zero;
            }

            return go;
        }

        public static void ClearCache()
        {
            SpriteCache.Clear();
        }
    }
}
