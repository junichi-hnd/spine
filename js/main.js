;(function(window){
  // -------------------------------------
  // defined functions
  // -------------------------------------
  var onLoadingCompleted, onProgress, textureLoaderLoad, textureLoaderUnLoad,
    onImageLoadCompleted, onJSONLoadingCompleted, onJSONLoadingProgress,
    update;
  // -------------------------------------
  // defined variables
  // -------------------------------------
  var canvasWidth = 0, canvasHeight = 0,
    atlas = null, canvas = null, xhr = null, texture = null,
    page, path, image,
    // createjs
    stage, container, dragon, containers,
    skeletonData, skeleton, state, stateData,
    lastTime;


  // -------------------------------------
  // functions
  // -------------------------------------

  onProgress = function(event){
    var progress = event.loaded / event.total;
    console.log('atlas file is loading ' + (progress * 100) + '%');
  };

  onLoadingCompleted = function(event){
    atlas = new spine.Atlas(xhr.response, {
      load: textureLoaderLoad,
      unload: textureLoaderUnLoad
    });
    xhr.removeEventListener('load', onLoadingCompleted);
    xhr.removeEventListener('progress', onProgress);
    xhr = null;
  };

  textureLoaderLoad = function(page, path, atlas){
    console.log(page, path, atlas);
    page = page;
    path = path;
    atlas = atlas;

    image = new Image();
    image.addEventListener('load', onImageLoadCompleted);
    console.log('path : ' + path);
    image.src = 'images/' + path;
  };

  textureLoaderUnLoad = function(event){
      texture.destroy();
  };

  onImageLoadCompleted = function(event){
    image.removeEventListener('load', onImageLoadCompleted);

    stage = new createjs.Stage(canvas);
    container = new createjs.Container();
    stage.addChild(container);

    dragon = new createjs.Container();
    dragon.scaleX = dragon.scaleY = 0.80;
    dragon.x = ~~(canvasWidth * 0.5);
    dragon.y = ~~(canvasHeight * 0.5) + 20;
    container.addChild(dragon);

    containers = [];

    var _region, _canvas, _ctx, container, _rotationContainer, _bitmap;

    for(var i = 0, num = atlas.regions.length; i < num; i++){
      _region = atlas.regions[i];
      _canvas = document.createElement('canvas');
      _canvas.id = _region.name;
      _canvas.width = _region.width;
      _canvas.height = _region.height;
      _ctx = _canvas.getContext('2d');
      _ctx.drawImage(image, -_region.x, -_region.y);

      _container = new createjs.Container();
      _rotationContainer = new createjs.Container();
      _rotationContainer.name = 'rotationContainer';
      _container.addChild(_rotationContainer);

      _bitmap = new createjs.Bitmap(_canvas);
      _bitmap.name = 'bitmap';
      _bitmap.x = _region.width * -0.5;
      _bitmap.y = _region.height * -0.5;
      _rotationContainer.addChild(_bitmap);
      _container.name = _region.name;

      dragon.addChild(_container);
      containers[i] = _container;
    }

    xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/dragon.json', true);
    xhr.addEventListener('load', onJSONLoadingCompleted);
    xhr.addEventListener('progress', onJSONLoadingProgress);
    xhr.send();
  };

  onJSONLoadingProgress = function(event){
    var progress = event.loaded / event.total;
    console.log('json file is loading ' + (progress * 100) + '%');
  };

  onJSONLoadingCompleted = function(event){
    xhr.removeEventListener('load', onJSONLoadingCompleted);
    xhr.removeEventListener('progress', onJSONLoadingProgress);

    var jsonSkeleton = new spine.SkeletonJson(new spine.AtlasAttachmentLoader(atlas));
    var _target = event.currentTarget;
    var _eval = eval("(" + _target.response + ")");
    skeletonData = jsonSkeleton.readSkeletonData(_eval);
    spine.Bone.yDown = true;

    skeleton = new spine.Skeleton(skeletonData);
    skeleton.updateWorldTransform();

    stateData = new spine.AnimationStateData(skeletonData);
    state = new spine.AnimationState(stateData);


    update();
  };

  update = function(){
    lastTime = lastTime || Date.now();
    var _diff = (Date.now() - lastTime) * 0.001;
    lastTime = Date.now();
    state.update(_diff);
    state.apply(skeleton);
    skeleton.updateWorldTransform();

    var _invisibleContainers = containers.slice();
    var _drawOrder = skeleton.drawOrder;
    var _slot, _attachment, _name, _bone, _container,
      _rotationContainer, _bitmap;
    for(var i = 0, num = _drawOrder.length; i < num; i++){
      _slot = _drawOrder[i];
      _attachment = _slot.attachment;
      _name = _attachment.name;
      _bone = _slot.bone;
      _container = dragon.getChildByName(_name);
      if(_container){
        _rotationContainer = _container.getChildByName('rotationContainer');
        _bitmap = _rotationContainer.getChildByName('bitmap');
        _container.visible = true;
        _container.x = _bone.worldX + _attachment.x * _bone.m00 + _attachment.y * _bone.m01;
        _container.y = _bone.worldY + _attachment.x * _bone.m10 + _attachment.y * _bone.m11;
        _container.scaleX = _bone.worldScaleX;
        _container.scaleY = _bone.worldScaleY;
        _container.rotation = -_slot.bone.worldRotation;
        _rotationContainer.rotation = -_attachment.rotation;
        dragon.addChild(_container);
        _invisibleContainers.splice(_invisibleContainers.indexOf(_container), 1);
      }
    }
    for(var key in _invisibleContainers){
      _invisibleContainers[key].visible = false;
    }
    stage.update();
    // window.requestAnimationFrame(update);
  }

  /**
   * initialized
   */
  var init = function(){
    canvasWidth = 640;
    canvasHeight = 671;
    atlas = 0;
    var _wrapper = document.getElementById('wrapper');
    _wrapper.style.width = canvasWidth + 'px';
    _wrapper.style.height = canvasHeight + 'px';

    canvas = _wrapper.getElementsByTagName('canvas')[0];
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // setup xhr to load an atlas file.
    xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/dragon.atlas', true);
    //xhr.onload = onLoadingCompleted;
    //xhr.onprogress = onProgress;
    xhr.addEventListener('load', onLoadingCompleted);
    xhr.addEventListener('progress', onProgress);
    xhr.send();
  };

  init();

})(window);
