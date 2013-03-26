
/**
 *  Twitter component alternative JS
 *  GsapCarousel - Carousel with GSAP animation
 *  
 *  This JQuery module is tested with JQuery 1.2.6
 *  
 *  @generator http://starter.pixelgraphics.us/
 *  @requires gsap-tweenlite.js
 *  @requires bootstrap.css (the ".carousel" related styles)
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
            base.i_previously_active = 0;
            
            //base.transition_direction = 'from_right';
            
            //      Need killswitch to detect when we just "looped" items
            base.looped = null;
            
            base.i_next = 1;
            base.tweens = [];
            base.interval = 0;
            base.i_width = base.options.w;
            base.i_height = base.options.h;
            
            //      Need a killswitch for controlling the cycle interval, depending on mouse interactions
            //      i.e. mouseenter > click an indicator button :
            //          if it's outside the main carousel mouseenter zone, we must prevent new setIntervals until mouseleave
            base.cycling_on_hold = false;
            
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
                
                //      Queue array : utility for handling items order
                //base.items_queue = [];
                base.items_positions = [];
                
                //      Individual items init
                for ( i = 0; i < base.items.length; i++ )
                {
                    //      Init "weights" (target position in the "queue")
                    //base.items_queue[ i ] = i;
                    
                    //      Absolute positionning (layout)
                    $( base.items[ i ]).css({
                        width: base.i_width,
                        height: base.i_height,
                        top: 0,
                        'z-index': i,
                        left: ( base.i_width * i )
                    });
                    
                    //      Init positions
                    base.items_positions[ i ] = base.i_width * i;
                }
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
                    
                    //      Z-index for depth sorting
                    btn.css( 'z-index', base.items_positions.length + 3 );
                    
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
                    
                    //      Z-index for depth sorting
                    current_indicator.parent().css( 'z-index', base.items_positions.length + 4 );
                    
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
                
                //      Hovering carousel-indicators pauses cycle too
                $( base.indicators ).bind( "mouseenter", base.stop_cycle )
                                    .bind( "mouseleave", base.start_cycle );
            }
            
            
            //--------------------------------------------------------------------------------
            //      Cycle
            
            //      Auto-start
            if ( base.options.cycle_autostart )
                base.start_cycle( base );
            
            //      When mouse-overing the carousel, pause the interval
            //      @todo - Disable completely when base.options.cycle_autostart is false ?
            base.$el.bind( "mouseenter", base.mouseenter_handler )
                    .bind( "mouseleave", base.mouseleave_handler );
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
                base.start_cycle();
            }
        };
        
        
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
            
            //      Items transition
            var i = 0,
                pos_x_active = 0,
                pos_x_outside_left = -base.i_width,
                pos_x_outside_right = base.i_width,
                next_active_i = base.get_next_active(),
                //prev_active_i = base.get_prev_active(),
                diff = pos - base.i_previously_active,
                transition_direction = ( diff > 0 ) ? 'from_right' : 'from_left' ;
            
            //      Direction override when the animation just "looped"
            if ( base.looped )
            {
                transition_direction = base.looped;
                base.looped = null;
            }
            
            //      debug
            //console.log( "--------------" );
            //console.log( "pos = " + pos );
            //console.log( "diff = " + diff );
            //console.log( "transition_direction = " + transition_direction );
            //console.log( "next_active_i = " + next_active_i );
            
            //      Each item individually animated
            for ( i = 0; i < base.items.length; i++ )
            {
                //      debug
                //console.log( "  item " + i );
                
                var diff_n = i - pos,
                    item = base.items[ i ],
                    previous_target_pos_x = base.items_positions[ i ],
                    target_pos_x = 0,
                    no_transition = false;
                
                if ( diff_n < -1 )
                    diff_n += base.items.length;
                
                //      debug
                //console.log( "    diff_n = " + diff_n );
                
                
                //      Active items
                //      -> transition in focus (main position)
                if ( i == pos )
                {
                    target_pos_x = 0;
                    
                    //      Fix Anim Glitch
                    //      Must slide from the left
                    if ( transition_direction == 'from_left' ) {
                        $( base.items[ i ]).css( 'left', pos_x_outside_left + "px" );
                    }
                    
                    //      Must slide from the right
                    else {
                        $( base.items[ i ]).css( 'left', pos_x_outside_right + "px" );
                    }
                    
                    //      Z-index on top, to mask anim crossed
                    $( base.items[ i ]).css( 'z-index', base.items.length + 2 );
                    
                    //      debug
                    //console.log( "    is 'active'" );
                }
                
                //      Previously active item
                //      -> transition out of focus (outside to the left or right, depending on transition_direction)
                else if ( i == base.i_previously_active )
                {
                    //      If it's also the next active item when FORWARD,
                    //      next transition's starting position takes precedence
                    if ( base.i_previously_active == next_active_i )
                    {
                        if ( transition_direction == 'from_right' )
                            target_pos_x = pos_x_outside_right;
                        else
                            target_pos_x = pos_x_outside_left;
                    }
                    else
                    {
                        if ( transition_direction == 'from_right' )
                            target_pos_x = pos_x_outside_left;
                        else
                            target_pos_x = pos_x_outside_right;
                    }
                    
                    //      Z-index 2nd, to mask anim crossed
                    $( base.items[ i ]).css( 'z-index', base.items.length + 1 );
                    
                    //      debug
                    //console.log( "    is 'previously_active'" );
                }
                
                //      Next active item
                //      -> must be positionned ready for next anim
                //      Note: this case excludes previously active items, as well as currently active items.
                else if ( i == next_active_i )
                {
                    //      Anticipate Anim Glitch
                    if ( transition_direction == 'from_left' && previous_target_pos_x < pos_x_active )
                        $( base.items[ i ]).css( 'left', pos_x_outside_right + "px" );
                    else if ( transition_direction == 'from_right' && previous_target_pos_x > pos_x_outside_right )
                        $( base.items[ i ]).css( 'left', pos_x_outside_left + "px" );
                    
                    //      Target is RIGHT outside pos (Next active item when FORWARD)
                    target_pos_x = pos_x_outside_right;
                    
                    //      Z-index normal
                    $( base.items[ i ]).css( 'z-index', i );
                    
                    //      debug
                    //console.log( "    is 'next_active'" );
                }
                
                //      Other items
                //      -> they shouldn't be visible - keep them out of sight
                else
                {
                    //      Anticipate Anim Glitch (out of sight)
                    if ( transition_direction == 'from_left' && previous_target_pos_x < pos_x_active )
                        $( base.items[ i ]).css( 'left', pos_x_outside_right + "px" );
                    else if ( transition_direction == 'from_right' && previous_target_pos_x > pos_x_outside_right )
                        $( base.items[ i ]).css( 'left', pos_x_outside_left + "px" );
                    
                    //      Positionning out of sight
                    target_pos_x = i * base.i_width;
                    
                    //      Z-index normal
                    $( base.items[ i ]).css( 'z-index', i );
                    
                    //      debug
                    //console.log( "    is 'normal'" );
                }
                
                //      debug
                //console.log( "    target_pos_x = " + target_pos_x );
                
                //      Tween
                if ( !no_transition )
                {
                    base.tweens.push(
                        TweenLite.to(
                            $( base.items[ i ]),
                            base.options.tween_speed,
                            {
                                left: target_pos_x,
                                onComplete: base.tween_complete,
                                onCompleteParams: [ i ]
                            }
                        )
                    );
                }
                
                //      Update previous positions for next call
                base.items_positions[ i ] = target_pos_x;
            }
            
            //      Update previously active item for next call
            base.i_previously_active = pos;
            
            //      Update current active item
            base.i_active = pos;
            base.update_controls_state();
        };
        
        
        /**
         *  Calculate what the next active item position will be when FORWARDING,
         *  without actually moving it.
         */
        base.get_next_active = function()
        {
            var new_cursor = base.i_active + 1;
			if ( new_cursor >= base.items.length )
                new_cursor = 0;
			return new_cursor;
        }
        
        
        /**
         *  Calculate what the next active item position will be when REWINDING,
         *  without actually moving it.
         */
        base.get_prev_active = function()
        {
            var new_cursor = base.i_active - 1;
			if ( new_cursor < 0 )
                new_cursor = new_cursor = base.items.length - 1;
			return new_cursor;
        }
        
        
        /**
         *  Next item
         */
        base.next = function()
        {
            //      Direction override (for transition animation)
            if ( base.i_active + 1 >= base.items.length )
                base.looped = 'from_right';
            base.slide_to( base.get_next_active());
        };
        
        
        /**
         *  Prev item
         */
        base.prev = function()
        {
            //      Direction override (for transition animation)
            if ( base.i_active - 1 < 0 )
                base.looped = 'from_left';
            base.slide_to( base.get_prev_active());
        };
        
        
        /**
         *  Event handler : Mouse enters carousel wrap (hover),
         *  which may not contain the "indicators"
         */
        base.mouseenter_handler = function()
        {
            //      Debug
            //console.log( "-- carousel mouseenter()" );
            
            //      Activate killswitch
            base.cycling_on_hold = true;
            base.stop_cycle();
        };
        
        
        /**
         *  Event handler : Mouse leaves carousel wrap
         */
        base.mouseleave_handler = function()
        {
            //      Debug
            //console.log( "-- carousel mouseleave()" );
            
            //      Release killswitch
            base.cycling_on_hold = false;
            base.start_cycle();
        };
        
        
        /**
         *  Start Cycle
         *  @see http://stackoverflow.com/questions/2749244/javascript-setinterval-and-this-solution
         */
        base.start_cycle = function()
        {
            //      debug
            //console.log( "start_cycle()" );
            //console.log( "  base.interval = " + base.interval );
            //console.log( "  base.cycling_on_hold = " + base.cycling_on_hold );
            
            if ( !base.interval && !base.cycling_on_hold )
            {
                //      debug
                //console.log( "  -> setInterval() fired" );
                
                base.interval = setInterval(
                    ( function( base )
                    {
                        return function() {
                            if ( base.next ) base.next();
                        }
                    })( base ),
                    base.options.cycle_speed
                );
            }
        };
        
        
        /**
         *  Stop Cycle
         */
        base.stop_cycle = function()
        {
            //      debug
            //console.log( "stop_cycle()" );
            //console.log( "  base.interval = " + base.interval );
            
            if ( base.interval )
            {
                //      debug
                //console.log( "  -> setInterval() cleared" );
                
                clearInterval( base.interval );
                base.interval = null;
            }
        };
        
        
        //      Run initializer
        base.init();

        //      Init transitions
        base.slide_to( 0 );
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
    
    
    //--------------------------------------------------------------------------------
    //      JQuery module constructor
    
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
