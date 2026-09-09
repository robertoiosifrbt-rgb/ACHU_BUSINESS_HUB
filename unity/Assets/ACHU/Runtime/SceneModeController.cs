using UnityEngine;
namespace Achu.BusinessHub
{
    public sealed class SceneModeController : MonoBehaviour
    {
        [SerializeField] private GameObject baseRoot;
        [SerializeField] private GameObject cityRoot;
        public bool IsCity { get; private set; }
        public void Configure(GameObject baseScene, GameObject cityScene){baseRoot=baseScene;cityRoot=cityScene;ShowBase();}
        public void ShowBase(){IsCity=false;if(baseRoot)baseRoot.SetActive(true);if(cityRoot)cityRoot.SetActive(false);}
        public void ShowCity(){IsCity=true;if(baseRoot)baseRoot.SetActive(false);if(cityRoot)cityRoot.SetActive(true);}
    }
}
