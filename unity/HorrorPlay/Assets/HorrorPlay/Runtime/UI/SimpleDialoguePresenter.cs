using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace HorrorPlay.UI
{
    public sealed class SimpleDialoguePresenter : MonoBehaviour
    {
        private Canvas canvas;
        private GameObject panel;
        private Text speakerText;
        private Text bodyText;
        private Coroutine hideRoutine;

        public static SimpleDialoguePresenter CreateRuntimeUI()
        {
            var root = new GameObject("DialogueUI");
            return root.AddComponent<SimpleDialoguePresenter>();
        }

        private void Awake()
        {
            BuildIfNeeded();
            Hide();
        }

        public void Show(string speaker, string body, float seconds = 0f)
        {
            BuildIfNeeded();
            speakerText.text = speaker;
            bodyText.text = body;
            panel.SetActive(true);
            if (hideRoutine != null) StopCoroutine(hideRoutine);
            if (seconds > 0f) hideRoutine = StartCoroutine(HideAfter(seconds));
        }

        public void Hide()
        {
            if (panel != null) panel.SetActive(false);
        }

        private IEnumerator HideAfter(float seconds)
        {
            yield return new WaitForSeconds(seconds);
            Hide();
            hideRoutine = null;
        }

        private void BuildIfNeeded()
        {
            if (canvas != null) return;

            if (EventSystem.current == null)
            {
                var eventSystem = new GameObject("EventSystem");
                eventSystem.AddComponent<EventSystem>();
                eventSystem.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
            }

            canvas = gameObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            gameObject.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            gameObject.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080);
            gameObject.AddComponent<GraphicRaycaster>();

            var safe = new GameObject("SafeArea", typeof(RectTransform));
            safe.transform.SetParent(transform, false);
            safe.AddComponent<SafeAreaPanel>();

            panel = new GameObject("DialoguePanel", typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(safe.transform, false);
            var panelRect = (RectTransform)panel.transform;
            panelRect.anchorMin = new Vector2(0.08f, 0.04f);
            panelRect.anchorMax = new Vector2(0.92f, 0.25f);
            panelRect.offsetMin = panelRect.offsetMax = Vector2.zero;
            panel.GetComponent<Image>().color = new Color(0.02f, 0.04f, 0.05f, 0.9f);

            speakerText = CreateText(panel.transform, "Speaker", 28, FontStyle.Bold, new Vector2(0.04f, 0.58f), new Vector2(0.96f, 0.92f));
            bodyText = CreateText(panel.transform, "Body", 30, FontStyle.Normal, new Vector2(0.04f, 0.08f), new Vector2(0.96f, 0.58f));
        }

        private static Text CreateText(Transform parent, string name, int size, FontStyle style, Vector2 anchorMin, Vector2 anchorMax)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            var rect = (RectTransform)go.transform;
            rect.anchorMin = anchorMin;
            rect.anchorMax = anchorMax;
            rect.offsetMin = rect.offsetMax = Vector2.zero;
            var text = go.GetComponent<Text>();
            text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            text.fontSize = size;
            text.fontStyle = style;
            text.color = new Color(0.88f, 0.86f, 0.78f);
            text.alignment = TextAnchor.MiddleLeft;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Overflow;
            return text;
        }
    }
}
