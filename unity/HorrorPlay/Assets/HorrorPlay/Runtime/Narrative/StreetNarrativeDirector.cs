using System.Collections;
using HorrorPlay.Atmosphere;
using UnityEngine;

namespace HorrorPlay.Narrative
{
    public sealed class StreetNarrativeDirector : MonoBehaviour
    {
        private bool noticeRead;
        private bool residentSpoken;
        private bool sequenceStarted;
        private bool sequenceScheduled;
        private StreetAtmosphere atmosphere;

        public bool IsAtmosphereSequenceEligible => noticeRead || residentSpoken;
        public bool SequenceStarted => sequenceStarted;

        public void Configure(StreetAtmosphere streetAtmosphere) => atmosphere = streetAtmosphere;

        public void MarkNoticeRead()
        {
            noticeRead = true;
            ScheduleIfEligible();
        }

        public void MarkResidentSpoken()
        {
            residentSpoken = true;
            ScheduleIfEligible();
        }

        public bool TryStartAtmosphereSequence()
        {
            if (!IsAtmosphereSequenceEligible || sequenceStarted) return false;
            sequenceStarted = true;
            if (atmosphere != null) atmosphere.PlayBellGreenAnomaly();
            return true;
        }

        private void ScheduleIfEligible()
        {
            if (!Application.isPlaying || !IsAtmosphereSequenceEligible || sequenceStarted || sequenceScheduled) return;
            sequenceScheduled = true;
            StartCoroutine(DelayedStart());
        }

        private IEnumerator DelayedStart()
        {
            yield return new WaitForSeconds(2.25f);
            sequenceScheduled = false;
            TryStartAtmosphereSequence();
        }
    }
}
