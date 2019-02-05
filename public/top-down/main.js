'use strict';

class DemoState extends GameState {

  preload() {
    super.preload();

    // Tiled exported tilemap
    game.load.tilemap('tavern', '/../assets/tavern.json', null, Phaser.Tilemap.TILED_JSON);
    // and it's corresponding tileset files
    game.load.image('tiles', '/../assets/tavern.json');
    // our sprite
    this.load.spritesheet('player', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });

  }

  create() {
    super.create();

    // initialize our tilemap
    // the player initialization is inside the initTilemap
    this.initTilemap();

    // we provide both keyboard and a virtual gamepad for player movement
    // this.initKeyboard();
    // this.initVirtualGamepad();
    cursors = this.input.keyboard.createCursorKeys();


    // cutscene
    // this.resetPlayer();

    // show collision layer
    game.input.keyboard.addKey(Phaser.KeyCode.C).onDown.add(() => {
      this.collisionLayer.visible = !this.collisionLayer.visible;
    });
  }

  initTilemap() {
   //  The 'tavern' key here is the Loader key given in game.load.tilemap
    let map = game.add.tilemap('tavern');
    // store a reference so we can access it elsewhere on this class
    this.map = map;

    // The first parameter is the tileset name, as specified in the Tiled map editor (and in the tilemap json file)
    // The second parameter maps this name to the Phaser.Cache key 'tiles'
    map.addTilesetImage('tiles', 'tiles');

    // create the base layer, these are the floors, walls
    // and anything else we want behind any sprites
    map.createLayer('Base');

    // next create the collision layer
    let collisionLayer = map.createLayer('Collision');
    this.collisionLayer = collisionLayer;

    // we don't want the collision layer to be visible
    collisionLayer.visible = false;

    // inform phaser that our collision layer is our collision tiles
    // in our case, since we separated out the collision tiles into its own layer
    // we pass an empty array and passing in true to enable collision
    map.setCollisionByExclusion([], true, this.collisionLayer);

    //  This resizes the game world to match the layer dimensions
    collisionLayer.resizeWorld();

    // we will have to initialize our player here
    // so it's sprite will show between the base and foreground tiles
    this.initPlayer();

    // creating the foreground layer last after all moving sprites
    // ensures that this layer will stay above during depth sorting
    map.createLayer('Foreground');

    // pull the exit area from the object layer
    // we will be using this one during update to check if our player has moved into the exit area
    let exit = this.map.objects.Meta.find( o => o.name == 'exit');
    this.exitRect = new Phaser.Rectangle(exit.x, exit.y, exit.width, exit.height);
  }

  initPlayer() {
    let player = game.add.sprite(0, 0, 'player');
    this.player = player;

    // basic stuff, the MOVE_SPEED is the same as the
    // max speed of the virtual game pad
    player.MOVE_SPEED = 150;
    player.anchor.set(0.5);
    player.scale.set(0.2);
    // player.animations.add('idle', [0 ,1 ,2 ,3 ,4 ,5 ,6 ,7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], 30, true);
    // player.animations.add('move', [20 ,21 ,22 ,23 ,24 ,25 ,26 ,27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38], 40, true);
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    player.play('move');

    // enable physics arcade
    // so phaser will take care of collision for us
    game.physics.arcade.enable(player);

    // set a custom smaller collision box for our player's sprite
    // so our player can fit into those area that have smaller walkable space
    player.body.setSize(100, 150,100, 50);

    // keep the camera following our player throughout
    game.camera.follow(player);
  }

  initKeyboard() {
    this.keyboardCursors = game.input.keyboard.createCursorKeys();
    this.moveSpeed = { x: 0, y: 0 }

    this.wasd = {
      up: game.input.keyboard.addKey(Phaser.Keyboard.W),
      down: game.input.keyboard.addKey(Phaser.Keyboard.S),
      left: game.input.keyboard.addKey(Phaser.Keyboard.A),
      right: game.input.keyboard.addKey(Phaser.Keyboard.D),
    };
  }

  initVirtualGamepad() {
    // create our virtual gamepad
    let gamepad = game.plugins.add(Phaser.Plugin.VirtualGamepad)
    this.joystick = gamepad.addJoystick(90, game.height - 90, 0.75, 'gamepad');

    // plugin wants the creation of a button
    // but there is no usage for it here so i'm just going to hide it
    let button = gamepad.addButton(game.width - 90, game.height - 90, 0.75, 'gamepad');
    button.visible = false;
  }

  resetPlayer() {
    // pull the entrace and start coordinates from the objects layer
    let entrance = this.map.objects.Meta.find( o => o.name == 'entrance');
    let start = this.map.objects.Meta.find( o => o.name == 'start');

    // flag so we can disable some parts of the game
    this.cutscene = true;

    // start position and angle of our player's sprite
    this.player.position.set(entrance.x, entrance.y);
    // this.player.angle = 0;

    // start the cutscene
    let tween = game.add.tween(this.player).to({x: start.x, y: start.y}, 1500);
    tween.onComplete.add(()=> {
      // return control back to player
      this.cutscene = false;
    });
    tween.start();
  }

  update() {
    // disable any update, inputs etc., during cutscenes
    // we don't want anything intefering
    if(this.cutscene) return;

    if (cursors.left.isDown) {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else if (cursors.up.isDown) {
        player.setVelocityY(-160);

        player.anims.play('turn');
    }
    else if (cursors.down.isDown) {
        player.setVelocityY(160);

        player.anims.play('turn');
    }

    // this.updatePlayer();

    // let phaser handle our player collision with the collision layer
    game.physics.arcade.collide(this.player, this.collisionLayer);
  }

  updatePlayer() {
    // shorthand so i don't have to reference this all the time
    let keyboardCursors = this.keyboardCursors;
    let wasd = this.wasd;
    let player = this.player;
    let moveSpeed = this.moveSpeed;
    let joystick = this.joystick;

    // set our player's velocity to 0
    // so the sprite doesn't move when there is no input from our player
    player.body.velocity.x = 0;
    player.body.velocity.y = 0;

    // keyboard movement
    // left and right keyboard movement
    if (keyboardCursors.left.isDown || wasd.left.isDown) moveSpeed.x = -player.MOVE_SPEED;
    else if (keyboardCursors.right.isDown || wasd.right.isDown) moveSpeed.x = player.MOVE_SPEED;
    else moveSpeed.x = 0;

    // up and down keyboard movement
    if (keyboardCursors.up.isDown || wasd.up.isDown) moveSpeed.y = -player.MOVE_SPEED;
    else if (keyboardCursors.down.isDown || wasd.down.isDown) moveSpeed.y = player.MOVE_SPEED;
    else moveSpeed.y = 0;

    if(Math.abs(moveSpeed.x) > 0 || Math.abs(moveSpeed.y) > 0) {
      player.body.velocity.x = moveSpeed.x;
      player.body.velocity.y = moveSpeed.y;

      // set direction using Math.atan2
      let targetPos = { x: player.x + moveSpeed.x, y: player.y + moveSpeed.y };
      player.rotation = Math.atan2(targetPos.y - player.y, targetPos.x - player.x);
    }

    // virtual gamepad movement
    // check first if it's in use before we go through all the logic below
    if (joystick.properties.inUse) {
      // set the sprite's angle from the plugin
      player.angle = joystick.properties.angle;

      // the plugin has a max of 99
      // i'm just adding a bit more for faster movement
      player.body.velocity.x = joystick.properties.x * 1.5;
      player.body.velocity.y = joystick.properties.y * 1.5;

      // check if player has entered the exit area
      if(Phaser.Rectangle.containsPoint(this.exitRect, player.position)) {
        // and we just reset it to it's starting position
        this.resetPlayer();
      }
    }

    // check if player is moving
    if(Math.abs(player.body.velocity.x) > 0 || Math.abs(player.body.velocity.y) > 0) {
      // play the animation, phaser just returns when it's currently animating
      // so it's fine to call it on every frame
      player.play('move');
    } else {
      player.play('idle');
    }
  }

  render() {
    super.render();

    if(this.collisionLayer.visible) {
      game.debug.body(this.player);
    }
  }
}