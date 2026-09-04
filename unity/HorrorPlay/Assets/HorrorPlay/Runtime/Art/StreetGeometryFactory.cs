using UnityEngine;

namespace HorrorPlay.Art
{
    public static class StreetGeometryFactory
    {
        public static GameObject Box(string name, Transform parent, Vector3 position, Vector3 scale, Material material, bool collider = false)
        {
            GameObject go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            go.GetComponent<MeshRenderer>().sharedMaterial = material;
            Collider c = go.GetComponent<Collider>();
            if (c != null) c.enabled = collider;
            return go;
        }

        public static GameObject Cylinder(string name, Transform parent, Vector3 position, Vector3 scale, Material material)
        {
            GameObject go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            go.GetComponent<MeshRenderer>().sharedMaterial = material;
            Collider c = go.GetComponent<Collider>();
            if (c != null) c.enabled = false;
            return go;
        }

        public static void Window(Transform parent, Vector3 position, Vector2 size, Material frame, Material glass)
        {
            Box("WindowFrame", parent, position, new Vector3(size.x + 0.16f, size.y + 0.16f, 0.10f), frame);
            Box("WarmGlass", parent, position + new Vector3(0f, 0f, -0.07f), new Vector3(size.x, size.y, 0.08f), glass);
        }
    }
}
