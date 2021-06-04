'use strict';

class ModelData
{
	constructor(runtime, sdkType)
	{
		this.data = {	obj: {points: [], faces: [], uvs: [], normals: [], scale:1, center: undefined},
						mtls: {}
					};
		this._runtime = runtime;
		this._sdkType = sdkType;
	}

	async load(objPath, mtlPath, scale)
	{
		let runtime = this._runtime;
		let sdkType = this._sdkType;
		let objURI = await runtime.GetAssetManager().GetProjectFileUrl(objPath);
		let mtlURI = await runtime.GetAssetManager().GetProjectFileUrl(mtlPath);
		let resultMtl = await this.loadMtl(mtlURI);
		let resultObj = await this.loadObj(objURI);
		if (resultMtl && resultObj)
		{
			console.info('[3DShape] modelData:', objPath, resultObj, this.data);
			sdkType.loaded = true;
		} else
		{
			console.warn('[3DShape] Unable to obj/mtl files');
		}
	}

	async loadObj(uri)
	{
		let fileData;
		try
		{
			let response = await fetch(uri);
			fileData = await response.text();
		} catch(err)
		{
			console.error('[3DShape], cannot fetch obj', uri);
			return false;
		}

		// Parse obj file
		const lines = fileData.split("\n");

		let data = this.data.obj;
					
		let i=0;
		let materialCurrent = "";
		let numFaces = 0;
		
		// Parse all lines
		while(i < lines.length) {
			  // do stuff
			const words = lines[i].split(" ");
			switch (words[0])
			{
				case "usemtl":
					materialCurrent = words[1];
					break;
				case "v":
					data.points.push([parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])]);
					break;
				case "n":
					data.normals.push([parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])]);
					break;
				case "vt":
					data.uvs.push([parseFloat(words[1]), parseFloat(words[2])]);
					break;
				case "f":
					numFaces++;
					let face = {};
					let elm = [];
					for (let i=0;i<words.length-1;i++)
					{
						let values = words[i+1].split("/");
						if (words.length == 1)
						{
							elm.push({v: parseInt(values[0])-1});				
						} else
						{
							elm.push({v: parseInt(values[0])-1, uv: parseInt(values[1])-1, n:parseInt(values[2])-1});								
						}
					}
					if (elm.length == 3)
					{
						if (elm[2].uv === undefined)
						{
							elm.push({v: elm[2].v});
						} else
						{
							elm.push({v: elm[2].v, uv: elm[2].uv, n:elm[2].n});
						}
					}
					face.p = elm;
					face.mtl = materialCurrent;
					data.faces.push(face);
				default:
			}
			i++;
		}
		return numFaces;
	}

	async loadMtl(uri)
	{
		let fileData;
		try
		{
			let response = await fetch(uri);
			fileData = await response.text();
		} catch(err)
		{
			console.error('[3DShape], cannot fetch mtl', uri);
			return false;
		}

		let data = this.data.mtls;

		// Parse mtl file
		const lines = fileData.split("\n");

		let materialCurrent = "";
		let i=0;
		// Parse all lines
		while(i < lines.length) {
			// parse
			const words = lines[i].split(" ");
			switch (words[0])
			{
				case "newmtl":
					data[words[1]] = {};
					materialCurrent = words[1];
					data[words[1]].textured = false;
					break;
				case "Kd":
					data[materialCurrent].r = parseFloat(words[1]);
					data[materialCurrent].g = parseFloat(words[2]);
					data[materialCurrent].b = parseFloat(words[3]);
					break;
				case "map_Kd":
					let p = words[1].split("/");
					let map = p[p.length-1]
					data[materialCurrent].map = map;
					// load texture into current available frame
					data[materialCurrent].textured = true;
					break;
				default:
			}
			i++;
		}
		return true;
	}
}

globalThis.ModelData3D = ModelData