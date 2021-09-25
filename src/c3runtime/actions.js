"use strict";
{
    self.C3.Plugins.Mikal_3DObject.Acts = {
        Rotate(angle, axis) {
            if (!this.loaded) return;
            this.model3D.rotate(angle, axis, false);
        },

        SetZElevation(z) {
            const wi = this.GetWorldInfo();
            wi.SetZElevation(z);
            wi._UpdateZElevation();
        },

        SetLocalCenter(x,y,z) {
            this.localCenter[0] = x;
            this.localCenter[1] = y;
            this.localCenter[2] = z;
        },

        SetScale(scale) {
            this.scale = scale;
        },
        
        SetRotationZXY(x,y,z) {
            // Order of rotation based on Unity's procedure: Z,X,Y
            if (!this.loaded) return;
            this.model3D.rotateZXY(x,y,z);
        },
        
        SetRotationOrdered(x,y,z,order) {
            if (!this.loaded) return;
            this.xAngle = x;
            this.yAngle = y;
            this.zAngle = z;
            // this.model3D.rotateOrdered(x,y,z,order);
        },

        PlayAnimation(animation) {
            if (!this.loaded) return;
            let names = this.gltf.getAnimationNames();
            let newAnimationIndex = -1;
            names.forEach((name, index) => {
                if (animation == name) {
                    newAnimationIndex = index;
                } 
            });
            if (newAnimationIndex >= 0)
            {
                this.animationTime = 0;
                this.animationLastTime = 0;
                this.animationIndex = newAnimationIndex
            }
        },
        SetAnimationRate(rate) {
            this.animationRate = rate;
        }
    };
}