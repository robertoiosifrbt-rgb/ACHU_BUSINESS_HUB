#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using Achu.BusinessHub;

namespace Achu.BusinessHub.Editor
{
    public static class AchuProjectBootstrap
    {
        private const string ScenePath = "Assets/Scenes/Main.unity";
        private const string B = "Assets/ACHU/Art/Buildings/";
        private const string R = "Assets/ACHU/Art/Roads/";
        private const string V = "Assets/ACHU/Art/Vehicles/";

        [MenuItem("ACHU/Build Unity Project Scene")]
        public static void Build()
        {
            Directory.CreateDirectory("Assets/Scenes");
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            BuildEnvironment();
            var runtime = new GameObject("ACHU Runtime");
            var game = runtime.AddComponent<GameDirector>();
            var modes = runtime.AddComponent<SceneModeController>();
            var hud = runtime.AddComponent<AchuHud>();
            var baseRoot = new GameObject("BASE");
            var cityRoot = new GameObject("CITY");
            BuildBase(baseRoot.transform);
            BuildCity(cityRoot.transform);
            modes.Configure(baseRoot, cityRoot);
            hud.Configure(game, modes);
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("ACHU Unity scene built: " + ScenePath);
        }

        private static void BuildEnvironment()
        {
            RenderSettings.ambientLight = new Color(.53f,.62f,.57f);
            var sun = new GameObject("Sun", typeof(Light));
            var light = sun.GetComponent<Light>();
            light.type = LightType.Directional; light.intensity = 1.15f; light.shadows = LightShadows.Soft;
            sun.transform.rotation = Quaternion.Euler(48,-35,0);
            var cam = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener));
            cam.tag = "MainCamera";
            var camera = cam.GetComponent<Camera>();
            camera.orthographic = true; camera.orthographicSize = 12.5f;
            camera.backgroundColor = new Color(.28f,.39f,.34f); camera.clearFlags = CameraClearFlags.SolidColor;
            cam.transform.position = new Vector3(15,19,-15); cam.transform.rotation = Quaternion.Euler(48,-45,0);
        }

        private static GameObject Model(string path, Transform parent, Vector3 pos, float yaw = 0, float scale = 1)
        {
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (!prefab) { Debug.LogWarning("Missing model: " + path); return null; }
            var go = (GameObject)PrefabUtility.InstantiatePrefab(prefab, parent);
            go.transform.localPosition = pos; go.transform.localRotation = Quaternion.Euler(0,yaw,0); go.transform.localScale = Vector3.one * scale;
            return go;
        }

        private static void Ground(Transform parent, float w, float d, Color color)
        {
            var g = GameObject.CreatePrimitive(PrimitiveType.Cube); g.name = "Ground"; g.transform.SetParent(parent,false);
            g.transform.localScale = new Vector3(w,.18f,d); g.transform.localPosition = new Vector3(0,-.12f,0);
            g.GetComponent<Renderer>().sharedMaterial = new Material(Shader.Find("Standard")) { color = color };
        }

        private static void Road(Transform p, string name, int x, int z, float yaw = 0, float scale = 1)
            => Model(R + name + ".fbx", p, new Vector3(x*2,0,z*2), yaw, scale);
        private static GameObject Building(Transform p, string name, Vector3 pos, float yaw = 0, float scale = 1)
            => Model(B + name + ".fbx", p, pos, yaw, scale);
        private static GameObject Vehicle(Transform p, string name, Vector3 pos, float yaw = 0, float scale = 1)
            => Model(V + name + ".fbx", p, pos, yaw, scale);

        private static void BuildBase(Transform root)
        {
            Ground(root,30,28,new Color(.42f,.56f,.48f));
            for(int z=-7;z<=-2;z++) Road(root,"road-straight",0,z);
            Road(root,"road-roundabout",0,-1,0,1.05f);
            for(int z=0;z<=5;z++) Road(root,"road-straight",0,z);
            Road(root,"road-intersection",0,2,90);
            for(int x=-1;x>=-5;x--) Road(root,"road-straight",x,2,90);
            Road(root,"road-end-round",-6,2,90);
            for(int x=1;x<=5;x++) Road(root,"road-straight",x,2,90);
            Road(root,"road-end-round",6,2,-90);
            Road(root,"road-intersection",0,-4,90);
            for(int x=-1;x>=-4;x--) Road(root,"road-straight",x,-4,90);
            for(int x=1;x<=4;x++) Road(root,"road-straight",x,-4,90);
            Road(root,"road-driveway-double",-4,-4,90); Road(root,"road-driveway-double",4,-4,-90);

            Building(root,"building-type-t",new Vector3(-3.2f,0,.2f),25,1.3f);
            Building(root,"building-type-o",new Vector3(3.3f,0,.2f),-20,1.05f);
            Building(root,"building-type-p",new Vector3(-7.5f,0,6.4f),10);
            Building(root,"building-type-k",new Vector3(-7.5f,0,2.5f),-5);
            Building(root,"building-type-n",new Vector3(-7.4f,0,-2.3f),5);
            Building(root,"building-type-l",new Vector3(-7.3f,0,-6.4f),-10);
            Building(root,"building-type-c",new Vector3(7.5f,0,6.2f),-10);
            Building(root,"building-type-s",new Vector3(7.4f,0,2.2f),8);
            Building(root,"building-type-i",new Vector3(7.7f,0,-2.5f));
            Building(root,"building-type-h",new Vector3(7.8f,0,-6.2f));
            Building(root,"building-type-e",new Vector3(-3.5f,0,8.2f),5);
            Building(root,"building-type-g",new Vector3(3.2f,0,8.1f),-5);
            Building(root,"building-type-q",new Vector3(3.4f,0,-8.0f));
            AddParking(root,new Vector3(-8.2f,0,-7.8f),false);
            AddParking(root,new Vector3(8.4f,0,-7.8f),true);
            AddTrees(root,24,12,10.8f);
            AddTraffic(root,"BaseTraffic",new[]{new Vector3(0,0,-12),new Vector3(0,0,-2),new Vector3(5,0,4),new Vector3(0,0,6),new Vector3(-5,0,4),new Vector3(0,0,-2)},4);
        }

        private static void BuildCity(Transform root)
        {
            Ground(root,54,46,new Color(.44f,.58f,.50f));
            for(int z=-10;z<=10;z++) Road(root,"road-straight",0,z);
            Road(root,"road-roundabout",0,1,0,1.1f);
            for(int x=-1;x>=-7;x--) Road(root,"road-straight",x,5,90);
            Road(root,"road-bend",-8,5,90);
            for(int z=4;z>=0;z--) Road(root,"road-straight",-8,z);
            Road(root,"road-bend",-8,-1,180);
            for(int x=-7;x<=-3;x++) Road(root,"road-straight",x,-1,90);
            Road(root,"road-end-round",-2,-1,-90);
            Road(root,"road-intersection",0,6,90);
            for(int x=1;x<=7;x++) Road(root,"road-straight",x,6,90);
            Road(root,"road-roundabout",8,6,0,.95f);
            for(int z=5;z>=2;z--) Road(root,"road-straight",8,z);
            Road(root,"road-end-round",8,1,180);
            Road(root,"road-intersection",0,-5,90);
            for(int x=1;x<=8;x++) Road(root,"road-straight",x,-5,90);
            Road(root,"road-bend",9,-5,-90);
            for(int z=-6;z>=-9;z--) Road(root,"road-straight",9,z);
            Road(root,"road-end-round",9,-10,180);
            Road(root,"road-intersection",0,-7,90);
            for(int x=-1;x>=-6;x--) Road(root,"road-straight",x,-7,90);
            Road(root,"road-end-round",-7,-7,90);
            BuildRiver(root); BuildBridge(root,-4,-8); BuildBridge(root,5,-8);
            Cluster(root,new Vector3(-12,0,8),new[]{"building-type-a","building-type-c","building-type-e","building-type-g"},1f);
            Cluster(root,new Vector3(-5,0,9),new[]{"building-type-d","building-type-n","building-type-s","building-type-u"},1.05f);
            Cluster(root,new Vector3(13,0,8),new[]{"building-type-k","building-type-o","building-type-j","building-type-b"},1.1f);
            Building(root,"building-type-h",new Vector3(14,0,-7),90,1.35f);
            Building(root,"building-type-i",new Vector3(14,0,-12),90,1.3f);
            Cluster(root,new Vector3(-12,0,-2),new[]{"building-type-p","building-type-q","building-type-c"},.95f);
            AddParking(root,new Vector3(16,0,-3),true); AddParking(root,new Vector3(13,0,12),false);
            AddTrees(root,38,23,19);
            AddTraffic(root,"CityTraffic",new[]{new Vector3(0,0,-18),new Vector3(0,0,2),new Vector3(16,0,12),new Vector3(0,0,12),new Vector3(-16,0,10),new Vector3(-16,0,-2),new Vector3(0,0,2)},10);
        }

        private static void Cluster(Transform root, Vector3 c, string[] models, float scale)
        {
            var offsets=new[]{new Vector3(-2.4f,0,1.8f),new Vector3(2.4f,0,1.8f),new Vector3(-2.4f,0,-1.8f),new Vector3(2.4f,0,-1.8f)};
            for(int i=0;i<models.Length;i++) Building(root,models[i],c+offsets[i],i%2==0?8:-8,scale);
        }
        private static void AddParking(Transform root, Vector3 c, bool logistics)
        {
            for(int i=0;i<4;i++){var name=logistics?(i%2==0?"delivery":"van"):(i%2==0?"sedan":"suv");Vehicle(root,name,c+new Vector3((i-1.5f)*1.3f,0,0),90,.8f);}
        }
        private static void AddTrees(Transform root,int count,float rx,float rz)
        {
            for(int i=0;i<count;i++){var a=i*2.399f;var p=new Vector3(Mathf.Cos(a)*rx,0,Mathf.Sin(a)*rz);Building(root,i%3==0?"tree-large":"tree-small",p,i*31f,.75f+(i%4)*.08f);}
        }
        private static void BuildRiver(Transform root)
        {
            var river=GameObject.CreatePrimitive(PrimitiveType.Cube); river.name="River"; river.transform.SetParent(root,false); river.transform.localPosition=new Vector3(0,-.05f,-16); river.transform.localScale=new Vector3(42,.08f,4.5f); river.GetComponent<Renderer>().sharedMaterial=new Material(Shader.Find("Standard")){color=new Color(.22f,.62f,.68f,.95f)};
        }
        private static void BuildBridge(Transform root,int x,int z)
        {
            Road(root,"road-slant-high",x,z+2); Road(root,"road-bridge",x,z+1); Road(root,"road-bridge",x,z); Road(root,"road-bridge",x,z-1); Road(root,"road-slant-high",x,z-2,180);
        }
        private static void AddTraffic(Transform root,string name,Vector3[] points,int cars)
        {
            var wpRoot=new GameObject(name+"Waypoints"); wpRoot.transform.SetParent(root,false); var wps=new List<Transform>();
            foreach(var p in points){var w=new GameObject("WP").transform;w.SetParent(wpRoot.transform,false);w.localPosition=p;wps.Add(w);}
            for(int i=0;i<cars;i++){var car=Vehicle(root,i%4==0?"delivery":i%4==1?"sedan":i%4==2?"suv":"van",points[i%points.Length],0,.72f);if(!car)continue;var agent=car.AddComponent<RoadTrafficAgent>();agent.waypoints=wps.ToArray();agent.speed=1.7f+(i%3)*.35f;}
        }
    }
}
#endif
