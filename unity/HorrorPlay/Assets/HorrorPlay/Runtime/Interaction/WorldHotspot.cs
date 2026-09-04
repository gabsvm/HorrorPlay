using System;
using UnityEngine;

namespace HorrorPlay.Interaction
{
    public sealed class WorldHotspot : MonoBehaviour
    {
        [SerializeField] private string hotspotId = "hotspot";
        [SerializeField] private string displayLabel = "Inspect";
        [SerializeField] private Transform interactionAnchor;
        [SerializeField, Min(0f)] private float activationRadius = 2.25f;
        [SerializeField] private bool requiresProximity = true;
        [SerializeField] private bool oneShot;

        private bool consumed;

        public event Action<WorldHotspot> Activated;

        public string HotspotId => hotspotId;
        public string DisplayLabel => displayLabel;
        public Transform InteractionAnchor => interactionAnchor != null ? interactionAnchor : transform;
        public bool IsConsumed => consumed;

        public void Configure(string id, string label, Transform anchor, float radius, bool proximityRequired, bool oneShotActivation)
        {
            hotspotId = id;
            displayLabel = label;
            interactionAnchor = anchor;
            activationRadius = Mathf.Max(0f, radius);
            requiresProximity = proximityRequired;
            oneShot = oneShotActivation;
            consumed = false;
        }

        public bool CanActivate(Vector3 actorPosition)
        {
            if (oneShot && consumed)
            {
                return false;
            }

            if (!requiresProximity)
            {
                return true;
            }

            Vector3 anchor = InteractionAnchor.position;
            anchor.y = actorPosition.y;
            return Vector3.Distance(actorPosition, anchor) <= activationRadius;
        }

        public bool TryActivate(Vector3 actorPosition)
        {
            if (!CanActivate(actorPosition))
            {
                return false;
            }

            if (oneShot)
            {
                consumed = true;
            }

            Activated?.Invoke(this);
            return true;
        }
    }
}
