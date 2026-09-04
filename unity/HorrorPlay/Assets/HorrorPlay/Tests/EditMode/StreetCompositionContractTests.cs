using HorrorPlay.Atmosphere;
using HorrorPlay.Street;
using NUnit.Framework;

namespace HorrorPlay.Tests
{
    public sealed class StreetCompositionContractTests
    {
        [Test]
        public void StreetBoundsRemainCanonicalForV1()
        {
            Assert.That(StreetBootstrap.StreetMinX, Is.EqualTo(-24f));
            Assert.That(StreetBootstrap.StreetMaxX, Is.EqualTo(24f));
            Assert.That(StreetBootstrap.StreetWidth, Is.EqualTo(48f));
        }

        [Test]
        public void RequiredHotspotIdsRemainStable()
        {
            Assert.That(StreetBootstrap.NoticeHotspotId, Is.EqualTo("harbor_closure_notice"));
            Assert.That(StreetBootstrap.ResidentHotspotId, Is.EqualTo("local_resident"));
            Assert.That(StreetBootstrap.TavernHotspotId, Is.EqualTo("tavern_door"));
        }

        [Test]
        public void MobileAtmosphereUsesLowerRainBudget()
        {
            Assert.That(StreetAtmosphere.MobileRainRate, Is.LessThan(StreetAtmosphere.DesktopRainRate));
        }
    }
}
