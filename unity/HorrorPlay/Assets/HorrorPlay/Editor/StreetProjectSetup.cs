using System.IO;
using System.Linq;
using HorrorPlay.Street;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

namespace HorrorPlay.Editor
{
    [InitializeOnLoad]
    public static class StreetProjectSetup
    {
        private const string SceneFolder = "Assets/HorrorPlay/Scenes";
        private const string ScenePath = SceneFolder + "/InnsmouthStreet.unity";
        private const string SettingsFolder = "Assets/HorrorPlay/Settings";
        private const string RendererPath = SettingsFolder + "/HorrorPlayRenderer.asset";
        private const string PipelinePath = SettingsFolder + "/HorrorPlayURP.asset";

        static StreetProjectSetup()
        {
            EditorApplication.delayCall += AutoSetup;
        }

        [MenuItem("HorrorPlay/Setup Innsmouth Street V1")]
        public static void Setup()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) return;
            EnsureFolders();
            EnsureRenderPipeline();
            EnsurePlayerSettings();
            EnsureScene();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("HorrorPlay: Innsmouth Street V1 setup complete.");
        }

        private static void AutoSetup()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode) return;
            if (!File.Exists(ScenePath) || AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath) == null)
            {
                Setup();
            }
        }

        private static void EnsureFolders()
        {
            Directory.CreateDirectory(SceneFolder);
            Directory.CreateDirectory(SettingsFolder);
        }

        private static void EnsureRenderPipeline()
        {
            UniversalRenderPipelineAsset pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelinePath);
            if (pipeline == null)
            {
                var renderer = ScriptableObject.CreateInstance<UniversalRendererData>();
                renderer.name = "HorrorPlayRenderer";
                renderer.renderingMode = RenderingMode.Forward;
                renderer.shadowTransparentReceive = false;
                AssetDatabase.CreateAsset(renderer, RendererPath);

                pipeline = UniversalRenderPipelineAsset.Create(renderer);
                pipeline.name = "HorrorPlayURP";
                pipeline.supportsHDR = false;
                pipeline.supportsCameraDepthTexture = true;
                pipeline.supportsCameraOpaqueTexture = false;
                pipeline.msaaSampleCount = 2;
                pipeline.renderScale = 1f;
                pipeline.shadowDistance = 24f;
                pipeline.shadowCascadeCount = 1;
                pipeline.maxAdditionalLightsCount = 4;
                AssetDatabase.CreateAsset(pipeline, PipelinePath);
            }

            GraphicsSettings.defaultRenderPipeline = pipeline;
            QualitySettings.renderPipeline = pipeline;
            EditorUtility.SetDirty(pipeline);
        }

        private static void EnsurePlayerSettings()
        {
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.LandscapeLeft;
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, "com.shomer.horrorplay");
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            EnableNewInputSystem();
        }

        private static void EnableNewInputSystem()
        {
            PlayerSettings playerSettings = Resources.FindObjectsOfTypeAll<PlayerSettings>().FirstOrDefault();
            if (playerSettings == null)
            {
                Debug.LogWarning("HorrorPlay: could not locate PlayerSettings to enable the Input System automatically.");
                return;
            }

            var serialized = new SerializedObject(playerSettings);
            SerializedProperty activeInputHandler = serialized.FindProperty("activeInputHandler");
            if (activeInputHandler == null)
            {
                Debug.LogWarning("HorrorPlay: activeInputHandler was not found; verify Active Input Handling is set to Input System Package (New).");
                return;
            }

            // Unity PlayerSettings values: 0 = old manager, 1 = new Input System, 2 = both.
            if (activeInputHandler.intValue != 1)
            {
                activeInputHandler.intValue = 1;
                serialized.ApplyModifiedPropertiesWithoutUndo();
            }
        }

        private static void EnsureScene()
        {
            if (!File.Exists(ScenePath))
            {
                Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                new GameObject("StreetBootstrap").AddComponent<StreetBootstrap>();
                EditorSceneManager.SaveScene(scene, ScenePath);
            }

            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        }
    }
}
