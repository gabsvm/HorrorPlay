using HorrorPlay.CameraSystem;
using HorrorPlay.Interaction;
using HorrorPlay.Player;
using NUnit.Framework;
using UnityEngine;

namespace HorrorPlay.Tests
{
    public sealed class StreetCoreTests
    {
        [Test]
        public void WalkTargetClampsToAuthoredStreetBounds()
        {
            var go = new GameObject("Inspector");
            var mover = go.AddComponent<InspectorMover>();
            mover.ConfigureBounds(-2f, 3f);

            Assert.That(mover.ClampTarget(-9f), Is.EqualTo(-2f));
            Assert.That(mover.ClampTarget(9f), Is.EqualTo(3f));
            Assert.That(mover.ClampTarget(1.25f), Is.EqualTo(1.25f));
            Object.DestroyImmediate(go);
        }

        [Test]
        public void HotspotRequiresProximityWhenConfigured()
        {
            var go = new GameObject("Hotspot");
            var hotspot = go.AddComponent<WorldHotspot>();
            hotspot.Configure("notice", "Read", go.transform, 2f, true, false);

            Assert.That(hotspot.CanActivate(new Vector3(1.9f, 0f, 0f)), Is.True);
            Assert.That(hotspot.CanActivate(new Vector3(2.1f, 0f, 0f)), Is.False);
            Object.DestroyImmediate(go);
        }

        [Test]
        public void OneShotHotspotCannotFireTwice()
        {
            var go = new GameObject("Hotspot");
            var hotspot = go.AddComponent<WorldHotspot>();
            hotspot.Configure("resident", "Speak", go.transform, 1f, false, true);
            int activations = 0;
            hotspot.Activated += _ => activations++;

            Assert.That(hotspot.TryActivate(Vector3.zero), Is.True);
            Assert.That(hotspot.TryActivate(Vector3.zero), Is.False);
            Assert.That(activations, Is.EqualTo(1));
            Object.DestroyImmediate(go);
        }

        [Test]
        public void CameraClampHandlesReversedBounds()
        {
            Assert.That(StreetCameraMath.ClampX(20f, 5f, -5f), Is.EqualTo(5f));
            Assert.That(StreetCameraMath.ClampX(-20f, 5f, -5f), Is.EqualTo(-5f));
        }

        [Test]
        public void MouseAndTouchIntentsCarryIdenticalPointerPosition()
        {
            Vector2 position = new Vector2(640f, 360f);
            var mouse = new InteractionIntent(position, PointerSource.Mouse);
            var touch = new InteractionIntent(position, PointerSource.Touch);

            Assert.That(mouse.ScreenPosition, Is.EqualTo(touch.ScreenPosition));
            Assert.That(mouse.Source, Is.Not.EqualTo(touch.Source));
        }
    }
}
