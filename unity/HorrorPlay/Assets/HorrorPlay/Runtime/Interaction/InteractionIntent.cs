using UnityEngine;

namespace HorrorPlay.Interaction
{
    public enum PointerSource
    {
        Mouse,
        Touch
    }

    public readonly struct InteractionIntent
    {
        public InteractionIntent(Vector2 screenPosition, PointerSource source)
        {
            ScreenPosition = screenPosition;
            Source = source;
        }

        public Vector2 ScreenPosition { get; }
        public PointerSource Source { get; }
    }
}
