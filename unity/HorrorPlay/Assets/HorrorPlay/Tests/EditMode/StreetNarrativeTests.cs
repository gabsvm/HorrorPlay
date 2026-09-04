using HorrorPlay.Narrative;
using NUnit.Framework;
using UnityEngine;

namespace HorrorPlay.Tests
{
    public sealed class StreetNarrativeTests
    {
        [Test]
        public void NoticeUnlocksAtmosphereSequenceAndSequenceIsOneShot()
        {
            var go = new GameObject("Narrative");
            var director = go.AddComponent<StreetNarrativeDirector>();
            Assert.That(director.IsAtmosphereSequenceEligible, Is.False);
            director.MarkNoticeRead();
            Assert.That(director.IsAtmosphereSequenceEligible, Is.True);
            Assert.That(director.TryStartAtmosphereSequence(), Is.True);
            Assert.That(director.TryStartAtmosphereSequence(), Is.False);
            Object.DestroyImmediate(go);
        }

        [Test]
        public void ResidentAlsoUnlocksAtmosphereSequence()
        {
            var go = new GameObject("Narrative");
            var director = go.AddComponent<StreetNarrativeDirector>();
            director.MarkResidentSpoken();
            Assert.That(director.IsAtmosphereSequenceEligible, Is.True);
            Object.DestroyImmediate(go);
        }
    }
}
