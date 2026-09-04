using System.Collections;
using UnityEngine;

namespace HorrorPlay.CameraSystem
{
    public sealed class StreetCameraController : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private float minX = -18f;
        [SerializeField] private float maxX = 18f;
        [SerializeField, Min(0.01f)] private float damping = 0.32f;
        [SerializeField] private float fixedY = 6f;
        [SerializeField] private float fixedZ = -18f;

        private float velocityX;
        private float narrativeOffsetX;

        public void Configure(Transform followTarget, float authoredMinX, float authoredMaxX, float y, float z, float followDamping)
        {
            target = followTarget;
            minX = Mathf.Min(authoredMinX, authoredMaxX);
            maxX = Mathf.Max(authoredMinX, authoredMaxX);
            fixedY = y;
            fixedZ = z;
            damping = Mathf.Max(0.01f, followDamping);
        }

        private void LateUpdate()
        {
            if (target == null)
            {
                return;
            }

            float desired = StreetCameraMath.ClampX(target.position.x + narrativeOffsetX, minX, maxX);
            float x = Mathf.SmoothDamp(transform.position.x, desired, ref velocityX, damping);
            transform.position = new Vector3(x, fixedY, fixedZ);
        }

        public void LookToward(float xOffset, float holdSeconds)
        {
            StopAllCoroutines();
            StartCoroutine(LookRoutine(xOffset, holdSeconds));
        }

        private IEnumerator LookRoutine(float xOffset, float holdSeconds)
        {
            float from = narrativeOffsetX;
            const float blend = 0.45f;
            for (float t = 0f; t < blend; t += Time.deltaTime)
            {
                narrativeOffsetX = Mathf.Lerp(from, xOffset, t / blend);
                yield return null;
            }

            narrativeOffsetX = xOffset;
            yield return new WaitForSeconds(Mathf.Max(0f, holdSeconds));

            from = narrativeOffsetX;
            for (float t = 0f; t < blend; t += Time.deltaTime)
            {
                narrativeOffsetX = Mathf.Lerp(from, 0f, t / blend);
                yield return null;
            }

            narrativeOffsetX = 0f;
        }
    }
}
