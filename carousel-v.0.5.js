
/**
 *  Twitter component alternative JS
 *  GsapCarousel - Carousel with GSAP animation
 *  
 *  This JQuery module has been tested with JQuery 1.2.6 (Drupal 6)
 *  
 *  @requires bootstrap.css (at least the ".carousel" related styles)
 *  @requires jquery >= 1.2.6.min.js
 *  @requires gsap/1.9.0/plugins/CSSPlugin.min.js
 *  @requires gsap/1.9.0/easing/EasePack.min.js
 *  @requires gsap/1.9.0/TweenLite.min.js
 *  
 *  @example test.html
 *  
 *  Sources :
 *  http://twitter.github.com/bootstrap/javascript.html#carousel
 *  http://starter.pixelgraphics.us/
 *  
 *  @author Paulmicha
 */

;(function( $ )
{
    $.GsapCarousel = function( el, options )
    {
        //      To avoid scope issues, use 'base' instead of 'this'
        //      to reference this class from internal events and functions.
        var base = this;
        
        //      Access to jQuery and DOM versions of element
        base.$el = $( el );
        base.el = el;
        
        //      Add a reverse reference to the DOM object
        base.$el.data( "GsapCarousel", base );
        
        
        /**
         *  Main entry point
         */
        base.init = function()
        {
            //      Overridable options
            base.options = $.extend( {}, $.GsapCarousel.defaultOptions, options );
            
            
            //--------------------------------------------------------------------------------
            //      Initialization
            
            var i = 0;
            base.id = base.$el.attr( 'id' );
            base.items = base.$el.find( ".item" );
            base.i_active = 0;
            base.i_next = 1;
            base.tweens = [];
            base.interval = 0;
            base.i_width = base.options.w;
            base.i_height = base.options.h;
            
            //      Styles changes from default Bootstrap carousel
            base.$el.css({ width: base.i_width, height: base.i_height });
            base.$el.find( '.carousel-inner' ).css( 'height', "100%" );
            base.$el.find( '.carousel-inner > .item' ).css({
                position: 'absolute',
                display: 'block',
                transition: 'none',
                '-webkit-transition': 'none',
                '-moz-transition': 'none',
                '-o-transition': 'none'
            });
            
            //      Carousel items
            if ( base.items.length > 1 )
            {
                base.i_last = base.items.size() - 1;
                base.i_prev = base.i_last;
                
                
                //      Absolute positionning
                for ( i = 0; i < base.items.length; i++ )
                    $( base.items[ i ]).css({ width: base.i_width, height: base.i_height, top: 0, left: ( base.i_width * i )});
            }
            
            //      Look for "indicators", which may be outside the container (referenced by id with "data-target")
            base.indicators = [];
            var indicators = $( ".carousel-indicators > [data-slide-to][data-target]" );
            if ( indicators.length > 1 )
            {
                for ( i = 0; i < indicators.length; i++ )
                {
                    var current_indicator = $( indicators[ i ]);
                    if ( current_indicator.attr( "data-target" ) == '#' + base.id )
                    {
                        base.indicators.push( indicators[ i ]);
                        
                        //      Styles changes from default Bootstrap carousel
                        $( indicators[ i ]).css( 'cursor', "pointer" );
                    }
                }
            }
        
        
            //--------------------------------------------------------------------------------
            //      Controls
            
            //      Btns prev/next
            var btns = base.$el.find( ".carousel-control[data-slide]" );
            if ( btns.length )
            {
                for ( i = 0; i < btns.length; i++ )
                {
                    var btn = $( btns[ i ]);
                    
                    //      Keep a shortcut reference to main carousel object
                    btn.data( 'carousel', base );
                    
                    //      Click Event Handler
                    btn.click( function( e )
                    {
                        var clicked_btn = $(this),
                            carousel = clicked_btn.data( 'carousel' );
                        if ( carousel )
                        {
                            if ( clicked_btn.attr( "data-slide" ) == 'next' )
                                carousel.next();
                            else if ( clicked_btn.attr( "data-slide" ) == 'prev' )
                                carousel.prev();
                            
                            //      Stop cycle when "manual" clicks are detected, until the end of triggered transitions
                            //      @see tween_complete()
                            carousel.stop_cycle();
                        }
                        
                        //      Disable normal link behaviour on click
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }
                
                //      Keep a shortcut reference from main carousel object
                base.btns = btns;
            }
            
            //      Btns "indicators"
            if ( base.indicators.length )
            {
                for ( i = 0; i < base.indicators.length; i++ )
                {
                    var current_indicator = $( base.indicators[ i ]);
                    
                    //      Keep a shortcut reference to main carousel object
                    current_indicator.data( 'carousel', base );
                    
                    //      Click Event Handler
                    current_indicator.click( function( e )
                    {
                        var clicked_btn = $(this),
                            carousel = clicked_btn.data( 'carousel' );
                        if ( carousel && clicked_btn.attr( "data-slide-to" ))
                        {
                            carousel.slide_to( clicked_btn.attr( "data-slide-to" ));
                            
                            //      Stop cycle when "manual" clicks are detected, until the end of triggered transitions
                            //      @see tween_complete()
                            carousel.stop_cycle();
                        }
                        
                        //      Disable normal link behaviour on click
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }
            }
            
            
            //--------------------------------------------------------------------------------
            //      Cycle
            
            //      Auto-start
            if ( base.options.cycle_autostart )
                base.start_cycle( base );
            
            //      When mouse-overing the carousel, pause the interval
            //      @todo - Disable completely when base.options.cycle_autostart is false ?
            base.$el.bind( "mouseenter", base.stop_cycle )
                    .bind( "mouseleave", base.start_cycle );
        };
        
        
        
        //--------------------------------------------------------------------------------
        //      Methods
        
        
        /**
         *  Helper : clear all running animations
         */
        base.clear_all_anims = function()
        {
            if ( base.tweens.length )
                for ( i = 0; i < base.tweens.length; i++ )
                    base.tweens[ i ].kill();
            base.tweens = [];
        };
        
        /**
         *  Helper : update classes
         */
        base.update_controls_state = function()
        {
            //      Items classes
            var i = 0;
            for ( i = 0; i < base.items.length; i++ )
            {
                if ( i == base.i_active )
                    $( base.items[ i ]).addClass( "active" );
                else
                    $( base.items[ i ]).removeClass( "active" );
            }
            
            //      Indicators classes
            if ( base.indicators.length )
            {
                for ( i = 0; i < base.indicators.length; i++ )
                {
                    if ( i == base.i_active )
                        $( base.indicators[ i ]).addClass( "active" );
                    else
                        $( base.indicators[ i ]).removeClass( "active" );
                }
            }
        };
        
        /**
         *  Helper: Tweenlite's onComplete callback
         */
        base.tween_complete = function( i )
        {
            //      Needs to be executed only once per "batch"
            if ( i == base.i_last )
            {
                base.clear_all_anims();
                
                //      Relaunch cycle (stopped when "manual" clicks are detected)
                if ( !base.interval )
                    base.start_cycle();
            }
        }
        
        /**
         *  Slide to any item
         */
        base.slide_to = function( pos )
        {
            //      Convert string (see data-attributes in indicators)
            pos = parseInt( pos );
            
            //      Nothing to do if we're already there
            if ( pos == base.i_active_item )
                return;
            
            //      Clear any possibly running animations
            base.clear_all_anims();
            
            //      Attributing all items positions at once
            var i = 0;
            var pos_left_first = pos * -base.i_width;
            for ( i = 0; i < base.items.length; i++ )
            {
                //      Tween
                base.tweens.push(
                    TweenLite.to(
                        $( base.items[ i ]),
                        base.options.tween_speed,
                        {
                            left: pos_left_first + i * base.i_width,
                            onComplete: base.tween_complete,
                            onCompleteParams: [ i ]
                        }
                    )
                );
            }
            
            //      Update current active item
            base.i_active = pos;
            base.update_controls_state();
        };
        
        /**
         *  Next item
         */
        base.next = function()
        {
            if ( base.i_active == base.i_last )
                base.slide_to( 0 );
            else
                base.slide_to( base.i_active + 1 );
        };
        
        /**
         *  Prev item
         */
        base.prev = function()
        {
            if ( base.i_active == 0 )
                base.slide_to( base.i_last );
            else
                base.slide_to( base.i_active - 1 );
        };
        
        /**
         *  Start Cycle
         *  @see http://stackoverflow.com/questions/2749244/javascript-setinterval-and-this-solution
         */
        base.start_cycle = function()
        {
            base.interval = setInterval(
                ( function( base )
                {
                    return function() {
                        if ( base.next ) base.next();
                    }
                })( base ),
                base.options.cycle_speed
            );
        };
        
        /**
         *  Stop Cycle
         */
        base.stop_cycle = function() {
            clearInterval( base.interval );
        };
        
        
        //      Run initializer
        base.init();
    };
    
    
    //--------------------------------------------------------------------------------
    //      Default settings
    
    $.GsapCarousel.defaultOptions = {
        w: 400,
        h: 200,
        tween_speed: .7,
        cycle_speed: 3200,
        cycle_autostart: true
    };
    
    
    /**
     *  JQuery module "instanciator", so that we can use :
     *  @example    $( ... ).gsapCarousel({ ... });
     */
    $.fn.gsapCarousel = function( options )
    {
        return this.each( function() {
            ( new $.GsapCarousel( this, options ));
        });
    };
    
    /**
     *  This function breaks the chain, but returns
     *  the GsapCarousel if it has been attached to the object.
     */
    $.fn.getGsapCarousel = function() {
        this.data( "GsapCarousel" );
    };
    
})( jQuery );
