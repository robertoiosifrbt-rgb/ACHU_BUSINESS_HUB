#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;
namespace Achu.BusinessHub.Editor
{
    public static class WebGLBuild
    {
        [MenuItem("ACHU/Build WebGL")]
        public static void BuildMenu()=>Build();
        public static void Build()
        {
            AchuProjectBootstrap.Build();
            Directory.CreateDirectory("Build/WebGL");
            var opts=new BuildPlayerOptions{scenes=new[]{"Assets/Scenes/Main.unity"},locationPathName="Build/WebGL",target=BuildTarget.WebGL,options=BuildOptions.None};
            var report=BuildPipeline.BuildPlayer(opts);
            if(report.summary.result!=BuildResult.Succeeded)throw new System.Exception("ACHU WebGL build failed: "+report.summary.result);
            Debug.Log($"ACHU WebGL build complete: {report.summary.totalSize} bytes");
        }
    }
}
#endif
