using UnityEditor;
using UnityEngine;

namespace HorrorPlay.Editor
{
    public sealed class StreetV2TextureImporter : AssetPostprocessor
    {
        private const string DerivedResourceRoot = "Assets/HorrorPlay/Art/StreetV2/Resources/StreetV2/";

        private void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith(DerivedResourceRoot)) return;

            TextureImporter importer = (TextureImporter)assetImporter;
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 16f;
            importer.filterMode = FilterMode.Point;
            importer.mipmapEnabled = false;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.alphaIsTransparency = true;
        }
    }
}
