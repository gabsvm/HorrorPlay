using UnityEngine;

namespace HorrorPlay.Player
{
    public sealed class InspectorMover : MonoBehaviour
    {
        [SerializeField] private float minX = -24f;
        [SerializeField] private float maxX = 24f;
        [SerializeField, Min(0.1f)] private float speed = 4.2f;
        [SerializeField] private Transform visualRoot;

        private float targetX;

        public float CurrentTargetX => targetX;
        public float MinX => minX;
        public float MaxX => maxX;

        private void Awake()
        {
            targetX = Mathf.Clamp(transform.position.x, minX, maxX);
            if (visualRoot == null)
            {
                visualRoot = transform;
            }
        }

        private void Update()
        {
            float currentX = transform.position.x;
            float delta = targetX - currentX;
            if (Mathf.Abs(delta) > 0.001f)
            {
                Vector3 p = transform.position;
                p.x = Mathf.MoveTowards(currentX, targetX, speed * Time.deltaTime);
                transform.position = p;
                Face(delta);
            }
        }

        public void ConfigureBounds(float authoredMinX, float authoredMaxX)
        {
            minX = Mathf.Min(authoredMinX, authoredMaxX);
            maxX = Mathf.Max(authoredMinX, authoredMaxX);
            targetX = ClampTarget(targetX);
        }

        public void ConfigureVisualRoot(Transform root)
        {
            visualRoot = root != null ? root : transform;
        }

        public float ClampTarget(float requestedX)
        {
            return Mathf.Clamp(requestedX, minX, maxX);
        }

        public void SetTarget(float worldX)
        {
            targetX = ClampTarget(worldX);
        }

        private void Face(float delta)
        {
            if (visualRoot == null || Mathf.Abs(delta) < 0.001f)
            {
                return;
            }

            Vector3 scale = visualRoot.localScale;
            float magnitude = Mathf.Max(0.0001f, Mathf.Abs(scale.x));
            scale.x = delta >= 0f ? magnitude : -magnitude;
            visualRoot.localScale = scale;
        }
    }
}
