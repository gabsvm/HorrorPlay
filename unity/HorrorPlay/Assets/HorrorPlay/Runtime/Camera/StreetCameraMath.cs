using UnityEngine;

namespace HorrorPlay.CameraSystem
{
    public static class StreetCameraMath
    {
        public static float ClampX(float desiredX, float minX, float maxX)
        {
            float low = Mathf.Min(minX, maxX);
            float high = Mathf.Max(minX, maxX);
            return Mathf.Clamp(desiredX, low, high);
        }
    }
}
