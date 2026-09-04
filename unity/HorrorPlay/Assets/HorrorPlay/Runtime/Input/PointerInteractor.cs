using HorrorPlay.Interaction;
using HorrorPlay.Player;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;

namespace HorrorPlay.Input
{
    public sealed class PointerInteractor : MonoBehaviour
    {
        [SerializeField] private UnityEngine.Camera worldCamera;
        [SerializeField] private InspectorMover mover;
        [SerializeField] private float maxRayDistance = 100f;

        private WorldHotspot pendingHotspot;

        public void Configure(UnityEngine.Camera cameraRef, InspectorMover inspectorMover)
        {
            worldCamera = cameraRef;
            mover = inspectorMover;
        }

        private void Update()
        {
            if (pendingHotspot != null && mover != null && pendingHotspot.CanActivate(mover.transform.position))
            {
                WorldHotspot toActivate = pendingHotspot;
                pendingHotspot = null;
                toActivate.TryActivate(mover.transform.position);
            }

            if (TryReadIntent(out InteractionIntent intent))
            {
                ProcessIntent(intent);
            }
        }

        public bool TryReadIntent(out InteractionIntent intent)
        {
            if (Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame)
            {
                intent = new InteractionIntent(Mouse.current.position.ReadValue(), PointerSource.Mouse);
                return true;
            }

            if (Touchscreen.current != null && Touchscreen.current.primaryTouch.press.wasPressedThisFrame)
            {
                intent = new InteractionIntent(Touchscreen.current.primaryTouch.position.ReadValue(), PointerSource.Touch);
                return true;
            }

            intent = default;
            return false;
        }

        public void ProcessIntent(InteractionIntent intent)
        {
            if (worldCamera == null || mover == null)
            {
                return;
            }

            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject())
            {
                return;
            }

            Ray ray = worldCamera.ScreenPointToRay(intent.ScreenPosition);
            if (!Physics.Raycast(ray, out RaycastHit hit, maxRayDistance))
            {
                return;
            }

            WorldHotspot hotspot = hit.collider.GetComponentInParent<WorldHotspot>();
            if (hotspot != null)
            {
                if (!hotspot.TryActivate(mover.transform.position))
                {
                    pendingHotspot = hotspot;
                    mover.SetTarget(hotspot.InteractionAnchor.position.x);
                }
                return;
            }

            pendingHotspot = null;
            mover.SetTarget(hit.point.x);
        }
    }
}
