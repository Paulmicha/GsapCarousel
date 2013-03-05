GsapCarousel
============

Twitter "carousel" component alternative JS (JQuery module) with GSAP animation

Usage :
```
    $('.carousel').gsapCarousel();
```

Example illustrating the default, overridable options :
```
    $('.carousel').gsapCarousel({
        w: 400,  //  width (pixels)
        h: 200,  //  height (pixels)
        tween_speed: .7,  //  Tweenlite duration (seconds)
        cycle_speed: 3200,  //  Cycling interval duration (milliseconds)
        cycle_autostart: true  //  Autostart cycle
    });
```
