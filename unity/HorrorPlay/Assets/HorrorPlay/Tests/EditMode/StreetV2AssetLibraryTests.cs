using HorrorPlay.Art;
using NUnit.Framework;

namespace HorrorPlay.Tests
{
    public sealed class StreetV2AssetLibraryTests
    {
        [Test]
        public void RequiredStreetV2ResourcesUseApprovedPackPrefixes()
        {
            Assert.That(StreetV2AssetLibrary.BackgroundResource, Is.EqualTo("StreetV2/warped_night_back"));
            Assert.That(StreetV2AssetLibrary.MidHarborResource, Is.EqualTo("StreetV2/warped_night_middle"));
            Assert.That(StreetV2AssetLibrary.CloudResource, Is.EqualTo("StreetV2/warped_night_clouds"));
            Assert.That(StreetV2AssetLibrary.TavernResource, Is.EqualTo("StreetV2/gothic_house_b"));
            Assert.That(StreetV2AssetLibrary.GroundResource, Is.EqualTo("StreetV2/gothic_ground"));
        }

        [Test]
        public void RequiredResourceNamesAreNonEmpty()
        {
            foreach (string resource in StreetV2AssetLibrary.RequiredResources)
            {
                Assert.That(resource, Is.Not.Null.And.Not.Empty);
            }
        }
    }
}
