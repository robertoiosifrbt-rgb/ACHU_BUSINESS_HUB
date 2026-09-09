using UnityEngine;
namespace Achu.BusinessHub
{
    [RequireComponent(typeof(RectTransform))]
    public sealed class SafeAreaFitter : MonoBehaviour
    {
        private Rect last; private RectTransform rt;
        private void Awake(){rt=(RectTransform)transform;Apply();}
        private void Update(){if(Screen.safeArea!=last)Apply();}
        private void Apply(){last=Screen.safeArea;var min=last.position;var max=last.position+last.size;min.x/=Screen.width;min.y/=Screen.height;max.x/=Screen.width;max.y/=Screen.height;rt.anchorMin=min;rt.anchorMax=max;rt.offsetMin=rt.offsetMax=Vector2.zero;}
    }
}
