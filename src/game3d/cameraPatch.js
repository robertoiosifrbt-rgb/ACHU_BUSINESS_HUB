import { Retro4XGame } from './Retro4XGame.js'

Retro4XGame.prototype.resize=function(){
 const w=innerWidth,h=innerHeight,aspect=w/h,view=this.mode==='world'?14.4:10.8
 this.camera.left=-view*aspect;this.camera.right=view*aspect;this.camera.top=view;this.camera.bottom=-view;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)
}
