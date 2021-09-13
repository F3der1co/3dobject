"use strict";
{
    const SDK = self.SDK;
    const PLUGIN_CLASS = SDK.Plugins.Mikal_3DObject;

    PLUGIN_CLASS.Instance = class Object3DInstance extends SDK.IWorldInstanceBase
    {
        constructor(sdkType, inst)
        {
            super(sdkType, inst);
            this.sdkType = sdkType;
            this.loaded = false;
            this.localCenter = [0,0,0]
            this.uid = inst.GetUID();
            this.layout = inst.GetLayout();
        }

        Release()
        {}

        OnCreate()
        {
            this.xAngle = this._inst.GetPropertyValue('angle-x');
            this.yAngle = this._inst.GetPropertyValue('angle-y');
            this.zAngle = this._inst.GetPropertyValue('angle-z');
            this.rotationOrder = this._inst.GetPropertyValue('rotation-order');
            this.scale = this._inst.GetPropertyValue('scale');
            this.zElevation =  this._inst.GetPropertyValue('z-elevation');
        }

        OnPlacedInLayout()
        {
            // Initialise to size of image
            this.OnMakeOriginalSize();
        }

        RendersToOwnZPlane() {
            return false;
        }

        Draw(iRenderer, iDrawParams)
        {
            if (!this.layoutView) this.layoutView = iDrawParams.GetLayoutView();
            const texture = this.GetTexture();

            if (texture)
            {
                this._inst.ApplyBlendMode(iRenderer);
                iRenderer.SetTexture(texture);

                if (!this.scale) this.scale = this._inst.GetPropertyValue('scale');

                let sdkType = this.sdkType;
                if (sdkType.initOwner == -1)
                {
                    sdkType.initOwner = this.uid;
                    this.objPath = this._inst.GetPropertyValue('obj-path');
                    this.mtlPath = this._inst.GetPropertyValue('mtl-path');
                    sdkType.modelData.load(this.objPath, this.mtlPath, this.scale, false);
                }

                if (!this.loaded)
                {
                    if (this.sdkType.loaded)
                    {
                        // Create local version here
                        this.model3D = new globalThis.Model3D(this._runtime, this.sdkType, this);
                        this.loaded = true;
                        this.localCenter = this.model3D.data.obj.center;
                        this.model3D.rotateOrdered(this.xAngle,this.yAngle,this.zAngle,this.rotationOrder);
                        this.layoutView.Refresh();
                    }
                    this.layoutView.Refresh();        
                }
                if (this.loaded)
                {
                    // 3D Model 
                    const data = this.model3D.data;
                    const p = data.obj.points;
                    const uv = data.obj.uvs;
                    const fs = data.obj.faces;
                    const n = data.obj.normals;
                    const mtls = data.mtls;

                    // const wi = this._inst.GetWorldInfo();
                    const x = this._inst.GetX();
                    const y = this._inst.GetY();
                    const z = this.zElevation;

                    iRenderer.SetTexture(texture);

                    const tempQuad = new SDK.Quad();

                    // Create function, to share with editor
                    let i=0;
                    while(i < fs.length)
                    {
                        let f = fs[i].p;
                        let mtl = fs[i].mtl

                        // XXX if (mtls[mtl].textured)
                        // XXX Only one texture (image) supported, so assume it exists (even if mtl file is not correct)
                        if (true)
                        {
                            tempQuad.set(
                            uv[f[0].uv][0], 1-uv[f[0].uv][1],
                            uv[f[1].uv][0], 1-uv[f[1].uv][1],
                            uv[f[2].uv][0], 1-uv[f[2].uv][1],
                            uv[f[3].uv][0], 1-uv[f[3].uv][1]
                            );
                        } else
                        {
                            // Set face to color if possible
                            tempQuad.set(0,0,1,0,0,1,1,1);
                        }
                        let center = this.localCenter;
                        // Could precalculate based on actions (e.g. scale, change localCenter)
                        iRenderer.Quad3D2(
                            x+(p[f[0].v][0]-center[0])*this.scale, y-(p[f[0].v][1]-center[1])*this.scale, z+(p[f[0].v][2]-center[2])*this.scale/10,
                            x+(p[f[1].v][0]-center[0])*this.scale, y-(p[f[1].v][1]-center[1])*this.scale, z+(p[f[1].v][2]-center[2])*this.scale/10,
                            x+(p[f[2].v][0]-center[0])*this.scale, y-(p[f[2].v][1]-center[1])*this.scale, z+(p[f[2].v][2]-center[2])*this.scale/10,
                            x+(p[f[3].v][0]-center[0])*this.scale, y-(p[f[3].v][1]-center[1])*this.scale, z+(p[f[3].v][2]-center[2])*this.scale/10,
                            tempQuad
                            );                
                        i++;
                    }
                }
            }
            else
            {
                // render placeholder
                iRenderer.SetAlphaBlend();
                iRenderer.SetColorFillMode();

                if (this.HadTextureError()) iRenderer.SetColorRgba(0.25, 0, 0, 0.25);
                else iRenderer.SetColorRgba(0, 0, 0.1, 0.1);

                iRenderer.Quad(this._inst.GetQuad());
            }
        }

        GetTexture()
        {
            const image = this.GetObjectType().GetImage();
            return super.GetTexture(image);
        }

        IsOriginalSizeKnown()
        {
            return true;
        }

        GetOriginalWidth()
        {
            return this.GetObjectType().GetImage().GetWidth();
        }

        GetOriginalHeight()
        {
            return this.GetObjectType().GetImage().GetHeight();
        }

        OnMakeOriginalSize()
        {
            const image = this.GetObjectType().GetImage();
            this._inst.SetSize(image.GetWidth(), image.GetHeight());
        }

        HasDoubleTapHandler()
        {
            return true;
        }

        OnDoubleTap()
        {
            this.GetObjectType().EditImage();
        }

        OnPropertyChanged(id, value)
        {
            switch(id)
            {
                case 'scale':
                    this.scale = value;
                    if (this.layoutView) this.layoutView.Refresh();
                    break;
                case 'z-elevation':
                    this.zElevation = value;
                    if (this.layoutView) this.layoutView.Refresh();
                    break;   
                case 'angle-x':
                case 'angle-y':
                case 'angle-z':
                case 'rotation-order':
                    let x = this._inst.GetPropertyValue('angle-x');
                    let y = this._inst.GetPropertyValue('angle-y');
                    let z = this._inst.GetPropertyValue('angle-z');
                    let order = this._inst.GetPropertyValue('rotation-order');
                    if (this.model3D) this.model3D.rotateOrdered(x,y,z,order);
                    if (this.layoutView) this.layoutView.Refresh();
                    break;
                case 'obj-path':
                    if (this.sdkType.initOwner = this.uid)
                    {
                        this.objPath = this._inst.GetPropertyValue('obj-path');
                        this.mtlPath = this._inst.GetPropertyValue('mtl-path');
                        this.sdkType.modelData.load(this.objPath, this.mtlPath, this.scale, false);
                    }
                    break
                default:
                    break;
            }
        }

        LoadC2Property(name, valueString)
        {
            return false; // not handled
        }
    };
}