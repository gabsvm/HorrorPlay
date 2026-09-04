using System.Collections;
using HorrorPlay.Art;
using HorrorPlay.CameraSystem;
using UnityEngine;

namespace HorrorPlay.Atmosphere
{
    public sealed class StreetAtmosphere : MonoBehaviour
    {
        public const int DesktopRainRate = 180;
        public const int MobileRainRate = 95;

        private GameObject anomalyReflection;
        private Light anomalyLight;
        private StreetCameraController streetCamera;
        private AudioSource audioSource;
        private ParticleSystem rain;
        private AudioClip bellClip;

        public void Build(Transform atmosphereRoot, StreetCameraController cameraController)
        {
            streetCamera = cameraController;
            BuildRain(atmosphereRoot);
            BuildFog(atmosphereRoot);
            BuildAnomaly(atmosphereRoot);
            audioSource = gameObject.AddComponent<AudioSource>();
            audioSource.spatialBlend = 0f;
            audioSource.volume = 0.32f;
            bellClip = CreateBellPlaceholder();
        }

        public void PlayBellGreenAnomaly()
        {
            StopAllCoroutines();
            StartCoroutine(Sequence());
        }

        private void BuildRain(Transform parent)
        {
            var go = new GameObject("Rain");
            go.transform.SetParent(parent, false);
            go.transform.position = new Vector3(0f, 14f, 0f);
            rain = go.AddComponent<ParticleSystem>();
            var main = rain.main;
            main.loop = true;
            main.startLifetime = 2.2f;
            main.startSpeed = 13f;
            main.startSize = 0.045f;
            main.startColor = new Color(0.55f, 0.66f, 0.7f, 0.35f);
            main.maxParticles = Application.isMobilePlatform ? 260 : 480;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            var emission = rain.emission;
            emission.rateOverTime = Application.isMobilePlatform ? MobileRainRate : DesktopRainRate;
            var shape = rain.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(52f, 1f, 8f);
            var renderer = go.GetComponent<ParticleSystemRenderer>();
            renderer.renderMode = ParticleSystemRenderMode.Stretch;
            renderer.lengthScale = 0.9f;
            renderer.velocityScale = 0.12f;
            renderer.sharedMaterial = StreetMaterialFactory.Transparent("RainMaterial", new Color(0.62f, 0.72f, 0.76f, 0.28f));
        }

        private void BuildFog(Transform parent)
        {
            Material fog = StreetMaterialFactory.Transparent("Fog", new Color(0.18f, 0.25f, 0.27f, 0.11f));
            StreetGeometryFactory.Box("FarFog", parent, new Vector3(-8f, 3.2f, 7.5f), new Vector3(36f, 5f, 0.08f), fog);
            StreetGeometryFactory.Box("NearFog", parent, new Vector3(12f, 2.1f, -1.8f), new Vector3(22f, 2.2f, 0.06f), fog);
        }

        private void BuildAnomaly(Transform parent)
        {
            Material green = StreetMaterialFactory.Lit("AnomalyReflection", new Color(0.09f, 0.15f, 0.14f), 0.78f, 0f, StreetPalette.SeaGreen, 1.2f);
            anomalyReflection = StreetGeometryFactory.Box("ImpossibleGreenReflection", parent, new Vector3(-20.5f, 0.05f, 1.8f), new Vector3(4.8f, 0.025f, 0.8f), green);
            anomalyLight = anomalyReflection.AddComponent<Light>();
            anomalyLight.type = LightType.Point;
            anomalyLight.color = StreetPalette.SeaGreen;
            anomalyLight.range = 5f;
            anomalyLight.intensity = 0f;
            anomalyReflection.SetActive(false);
        }

        private IEnumerator Sequence()
        {
            for (int i = 0; i < 3; i++)
            {
                if (audioSource != null && bellClip != null) audioSource.PlayOneShot(bellClip);
                yield return new WaitForSeconds(1.15f);
            }

            if (rain != null)
            {
                var emission = rain.emission;
                emission.rateOverTimeMultiplier *= 0.32f;
            }

            anomalyReflection.SetActive(true);
            anomalyLight.intensity = 0.65f;
            if (streetCamera != null) streetCamera.LookToward(-2.2f, 1.8f);

            yield return new WaitForSeconds(1.8f);
            for (float t = 0f; t < 1.4f; t += Time.deltaTime)
            {
                anomalyLight.intensity = Mathf.Lerp(0.65f, 0f, t / 1.4f);
                yield return null;
            }
            anomalyReflection.SetActive(false);

            if (rain != null)
            {
                var emission = rain.emission;
                emission.rateOverTime = Application.isMobilePlatform ? MobileRainRate : DesktopRainRate;
            }
        }

        private static AudioClip CreateBellPlaceholder()
        {
            const int sampleRate = 22050;
            const float duration = 1.15f;
            int samples = Mathf.RoundToInt(sampleRate * duration);
            float[] data = new float[samples];
            for (int i = 0; i < samples; i++)
            {
                float t = i / (float)sampleRate;
                float envelope = Mathf.Exp(-3.2f * t);
                data[i] = (Mathf.Sin(2f * Mathf.PI * 220f * t) * 0.55f + Mathf.Sin(2f * Mathf.PI * 660f * t) * 0.18f) * envelope;
            }
            AudioClip clip = AudioClip.Create("PlaceholderBell", samples, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }
    }
}
