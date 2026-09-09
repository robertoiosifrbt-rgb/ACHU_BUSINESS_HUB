using UnityEngine;
namespace Achu.BusinessHub
{
    public sealed class RoadTrafficAgent : MonoBehaviour
    {
        public Transform[] waypoints; public float speed=2.2f; public bool loop=true; private int index;
        private void Update(){if(waypoints==null||waypoints.Length<2)return;var target=waypoints[index];var delta=target.position-transform.position;delta.y=0;if(delta.sqrMagnitude<.08f){index++;if(index>=waypoints.Length)index=loop?0:waypoints.Length-1;return;}var dir=delta.normalized;transform.position+=dir*speed*Time.deltaTime;transform.rotation=Quaternion.Slerp(transform.rotation,Quaternion.LookRotation(dir,Vector3.up),10f*Time.deltaTime);}
    }
}
