module.declare([
    {jquery:    "vendor/jquery"},
    {flipclock: "js/ui/flipclock"},
    {dialog:    "js/ui/dialog"},
    {blinker:   "js/ui/blinker"},
    {utils:     "js/utils"}
], function(require, exports, module) {

    var $ = require("jquery").jQuery,
        flipclock = require("flipclock"),
        dialog    = require("dialog"),
        utils     = require("utils"),
        blinker   = require("blinker");

    var layout, countdown_blink;

    // App configuration
    App = {
        page: {
            clock: "clock",
            countdown: "countdown"
        }
    };

    // Prevent scrolling on Android / iOS devices
    document.ontouchmove = function(e){e.preventDefault();}
    document.ontouchstart = function(e){e.preventDefault();}

    function center(element) {
        var element_width = element.outerWidth(),
            element_height = element.outerHeight(),
            window_width = $("#container").width(),
            window_height = $("#container").height();

        if (element_height < window_height) {
            element.css("top", ((window_height-element_height)/2) + 'px');
        }
        if (element_width < window_width) {
            element.css("left", ((window_width-element_width)/2) + 'px');
        }
    }

    var resize = function(e) {
        // Center Timebox
        center($(".time_box"));
        center($(".countdown_box"));
    };

    $(window).resize(resize);

    // Routing
    $(window).hashchange( function(){
        var active_page = '';

        return function() {
            var splitHash = [],
                section = '',
                data = '';

            // Alerts every time the hash changes!
            var hash = location.hash;
            if (hash.indexOf("#") >= 0) {
                hash = hash.replace("#!", "");
                hash = hash.replace("#", "");
                splitHash = hash.split("/");
                section = splitHash[1];
                data = splitHash[2];
            }

            switch (section) {
                // Handle countdown clocks
                case "c":
                case "countdown":
                    stopClock();
                    active_page = App.page.countdown;
                    var params = utils.parseTimeOutOfParams(data)

                    initCountdown(params);
                    break;

                // Default to clock mode
                default:
                    if (active_page === App.page.clock) break;
                    stopClock();
                    active_page = App.page.clock;
                    initClock();
            }

            resize();
        }
    }());

    $(document).ready(function() {
        // Setup dialogs
        $(".dialog").append('<a href="javascript:;" hideDialog="true" class="close button button_right">x</a>')
        $(".dialog").bind("mouseup", function(e){return false;});
        $(".dialog").bind("touchend", function(e){return false;});
        $(".dialog_container").bind("mouseup", dialog.hide);
        $(".dialog_container").bind("touchend", dialog.hide);

        // Trigger the event
        $(window).hashchange();

        $("#toolbar").bind('click', function(e){
            // prevent click action from bubbling up to the container
            e.preventDefault();
            return false;
        });

        var toggle_toolbar = function(e) {
            if (e.returnValue === false) return false;
            $("body").toggleClass("toolbar_active");
            e.preventDefault();
        };

        // Prevent dragging
        $("#container, #toolbarContainer").bind('click', toggle_toolbar);

        $("#container, #toolbarContainer").bind('touchstart', toggle_toolbar);

        // Prepare for BLINK
        $("#container").addClass("blink_transition");

        var button_down = function(e) {
            $(this).removeClass("active");
            $(this).addClass("down");
            e.preventDefault();
        };
        var button_up = function(e) {
            var pressed = $(this).hasClass("down");
            $(this).removeClass("down");
            if (pressed) {
                // Active Event
                $(this).trigger("action");
            }
            e.preventDefault();
        };
        var button_over = function(e) {
            $(this).addClass("active");
        };
        var button_out = function(e) {
            $(this).removeClass("active");
            $(this).removeClass("down");
        };

        $(".button").append($('<div class="button_inner" />'));
        $(".button").bind("mousedown", button_down);
        $(".button").bind("mouseup", button_up);
        $(".button").bind("mouseover", button_over);
        $(".button").bind("mouseout", button_out);

        $(".button").bind("touchstart", button_down);
        $(".button").bind("touchend", button_up);
        $(".button").bind("touchcancel", button_up);
        $(".button").bind("touchmove", function(event) {
            // for (item in event) console.log(item + " = " + event[item]);
            var x = event.originalEvent.targetTouches[0].pageX;
            var y = event.originalEvent.targetTouches[0].pageY;
            // alert(x + ", " + y);
            var offset = $(this).offset();
            var left = offset.left;
            var top = offset.top;
            var right = left + $(this).outerWidth();
            var bottom = top + $(this).outerHeight();

            // console.log("left: " + left + ", x: " + x + ", right: " + right + ", top: " + top +  ", y: " + y + ", bottom: " + bottom);
            if (x < left || x > right || y < top || y > bottom) {
                // Out of button
                $(this).removeClass("down");
                event.preventDefault();
                return false;
            }
        });

        $(".button").bind("action", function(e) {
            if ($(this).attr("dialog")) {
                dialog.show($(this).attr("dialog"));
                e.preventDefault();

            } else if ($(this).attr("hideDialog")) {
                dialog.hide();
                e.preventDefault();

            } else {
                document.location = $(this).attr("href");
            }
        });
    });

    function stopClock() {
        // Clear any existing clock/timer
        $("#container").empty();
        if (layout) layout.stop(false);
        if (countdown_blink) {
            countdown_blink.stop();
            countdown_blink = undefined;
        }
    }

    function initClock() {
        var params = {
            container: $("#container"),
            start: true
        };
        layout = flipclock.load(flipclock.layouts.timeAMPM, params);
    }

    function initCountdown(params) {
        params.done = function() {
            countdown_blink = blinker.blink({
                target: $("#container")
            });
        };
        params.container = $("#container");
        params.start = true;

        layout = flipclock.load(flipclock.layouts.countdown, params);
    }
});