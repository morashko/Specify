// page init
jQuery(function(){
  initTabs();
  initAnchors();
  initSubscribeForm();
});

// analytics module
var Analytics = {
  sendEvent: function(category, action, label, value) {
    if (window.ga) {
      ga('send', 'event', category, action, label, value);
    }
  }
};

// form validation function
function initSubscribeForm() {
  var minSendingDelay = 1500;
  var errorClass = 'is-error';
  var successClass = 'field-valid';
  var sentClass = 'is-success';
  var sendingClass = 'form-sending';
  var regEmail = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

  jQuery('form.subscribe').each(function(){
    var form = jQuery(this).attr('novalidate', 'novalidate');
    var fieldset = form.find('fieldset');
    var successFlag = true;
    var inputs = form.find('input, textarea, select');
    
    // form validation function
    function validateForm(e) {
      e.preventDefault(e);
      successFlag = true;
      inputs.each(checkField);

      if (successFlag) {
        Analytics.sendEvent('user', 'subscribe', form.data('form-name'), 1);
        submitFormData();
      }
    }
    
    // send form
    function submitFormData() {
      var ajaxFlag, timerFlag;

      jQuery.ajax({
        type: form.attr('method'),
        url: form.attr('action'),
        data: form.serialize(),
        success: function() {
          ajaxFlag = true;
          if (timerFlag) {
            revealThankYou();
          }
        },
        error: function() {
          ajaxFlag = true;
        }
      });

      form.addClass(sendingClass);
      fieldset.attr('disabled', 'disabled');

      setTimeout(function() {
        timerFlag = true;
        if (ajaxFlag) {
          revealThankYou();
        }
      }, minSendingDelay);

      var revealThankYou = function() {
        form.removeClass(errorClass).addClass(sentClass);
        fieldset.removeAttr('disabled');
        form.removeClass(sendingClass);
      }
    }

    // check field
    function checkField(i, obj) {
      var currentObject = jQuery(obj);
      var currentParent = currentObject.parent();
      
      // not empty fields
      if (currentObject.is('.required')) {
        setState(currentParent, currentObject, !currentObject.val().length || currentObject.val() === currentObject.prop('defaultValue'));
      }
      // correct email fields
      if (currentObject.is('[type="email"]')) {
        setState(currentParent, currentObject, !regEmail.test(currentObject.val()));
      }
    }
    
    // set state
    function setState(hold, field, error) {
      hold.removeClass(errorClass).removeClass(successClass);
      if(error) {
        hold.addClass(errorClass);
        field.one('focus',function(){hold.removeClass(errorClass).removeClass(successClass);});
        successFlag = false;
      } else {
        hold.addClass(successClass);
      }
    }
    
    // form event handlers
    form.submit(validateForm);
  });
}

// content tabs init
function initTabs() {
  jQuery('ul.tabs').contentTabs({
    addToParent: true,
    animSpeed: 200,
    effect: 'fade',
    tabLinks: 'a'
  });
}

// initialize smooth anchor links
function initAnchors() {
  new SmoothScroll({
    anchorLinks: 'a.down',
    wheelBehavior: 'ignore'
  });
}

/*
 * jQuery Tabs plugin
 */
;(function($){
  $.fn.contentTabs = function(o){
    // default options
    var options = $.extend({
      activeClass:'active',
      addToParent:false,
      autoHeight:false,
      autoRotate:false,
      checkHash:false,
      animSpeed:400,
      switchTime:3000,
      effect: 'none', // "fade", "slide"
      tabLinks:'a',
      attrib:'href',
      event:'click'
    },o);

    return this.each(function(){
      var tabset = $(this), tabs = $();
      var tabLinks = tabset.find(options.tabLinks);
      var tabLinksParents = tabLinks.parent();
      var prevActiveLink = tabLinks.eq(0), currentTab, animating;
      var tabHolder;

      // handle location hash
      if(options.checkHash && tabLinks.filter('[' + options.attrib + '="' + location.hash + '"]').length) {
        (options.addToParent ? tabLinksParents : tabLinks).removeClass(options.activeClass);
        setTimeout(function() {
          window.scrollTo(0,0);
        },1);
      }

      // init tabLinks
      tabLinks.each(function(){
        var link = $(this);
        var href = link.attr(options.attrib);
        var parent = link.parent();
        href = href.substr(href.lastIndexOf('#'));

        // get elements
        var tab = $(href).hide().addClass(tabHiddenClass);
        tabs = tabs.add(tab);
        link.data('cparent', parent);
        link.data('ctab', tab);

        // find tab holder
        if(!tabHolder && tab.length) {
          tabHolder = tab.parent();
        }

        // show only active tab
        var classOwner = options.addToParent ? parent : link;
        if(classOwner.hasClass(options.activeClass) || (options.checkHash && location.hash === href)) {
          classOwner.addClass(options.activeClass);
          prevActiveLink = link; currentTab = tab;
          tab.removeClass(tabHiddenClass).width('');
          contentTabsEffect[options.effect].show({tab:tab, fast:true});
        } else {
          var tabWidth = tab.width();
          if(tabWidth) {
            tab.width(tabWidth);
          }
          tab.addClass(tabHiddenClass);
        }

        // event handler
        link.bind(options.event, function(e){
          if(link != prevActiveLink && !animating) {
            switchTab(prevActiveLink, link);
            prevActiveLink = link;
          }
        });
        if(options.attrib === 'href') {
          link.bind('click', function(e){
            e.preventDefault();
          });
        }
      });

      // tab switch function
      function switchTab(oldLink, newLink) {
        animating = true;
        var oldTab = oldLink.data('ctab');
        var newTab = newLink.data('ctab');
        prevActiveLink = newLink;
        currentTab = newTab;

        // refresh pagination links
        (options.addToParent ? tabLinksParents : tabLinks).removeClass(options.activeClass);
        (options.addToParent ? newLink.data('cparent') : newLink).addClass(options.activeClass);

        // hide old tab
        resizeHolder(oldTab, true);
        contentTabsEffect[options.effect].hide({
          speed: options.animSpeed,
          tab:oldTab,
          complete: function() {
            // show current tab
            resizeHolder(newTab.removeClass(tabHiddenClass).width(''));
            contentTabsEffect[options.effect].show({
              speed: options.animSpeed,
              tab:newTab,
              complete: function() {
                if(!oldTab.is(newTab)) {
                  oldTab.width(oldTab.width()).addClass(tabHiddenClass);
                }
                animating = false;
                resizeHolder(newTab, false);
                autoRotate();
                $(window).trigger('resize');
              }
            });
          }
        });
      }

      // holder auto height
      function resizeHolder(block, state) {
        var curBlock = block && block.length ? block : currentTab;
        if(options.autoHeight && curBlock) {
          tabHolder.stop();
          if(state === false) {
            tabHolder.css({height:''});
          } else {
            var origStyles = curBlock.attr('style');
            curBlock.show().css({width:curBlock.width()});
            var tabHeight = curBlock.outerHeight(true);
            if(!origStyles) curBlock.removeAttr('style'); else curBlock.attr('style', origStyles);
            if(state === true) {
              tabHolder.css({height: tabHeight});
            } else {
              tabHolder.animate({height: tabHeight}, {duration: options.animSpeed});
            }
          }
        }
      }
      if(options.autoHeight) {
        $(window).bind('resize orientationchange', function(){
          tabs.not(currentTab).removeClass(tabHiddenClass).show().each(function(){
            var tab = jQuery(this), tabWidth = tab.css({width:''}).width();
            if(tabWidth) {
              tab.width(tabWidth);
            }
          }).hide().addClass(tabHiddenClass);

          resizeHolder(currentTab, false);
        });
      }

      // autorotation handling
      var rotationTimer;
      function nextTab() {
        var activeItem = (options.addToParent ? tabLinksParents : tabLinks).filter('.' + options.activeClass);
        var activeIndex = (options.addToParent ? tabLinksParents : tabLinks).index(activeItem);
        var newLink = tabLinks.eq(activeIndex < tabLinks.length - 1 ? activeIndex + 1 : 0);
        prevActiveLink = tabLinks.eq(activeIndex);
        switchTab(prevActiveLink, newLink);
      }
      function autoRotate() {
        if(options.autoRotate && tabLinks.length > 1) {
          clearTimeout(rotationTimer);
          rotationTimer = setTimeout(function() {
            if(!animating) {
              nextTab();
            } else {
              autoRotate();
            }
          }, options.switchTime);
        }
      }
      autoRotate();
    });
  };

  // add stylesheet for tabs on DOMReady
  var tabHiddenClass = 'js-tab-hidden';
  (function() {
    var tabStyleSheet = $('<style type="text/css">')[0];
    var tabStyleRule = '.'+tabHiddenClass;
    tabStyleRule += '{position:absolute !important;left:-9999px !important;top:-9999px !important;display:block !important}';
    if (tabStyleSheet.styleSheet) {
      tabStyleSheet.styleSheet.cssText = tabStyleRule;
    } else {
      tabStyleSheet.appendChild(document.createTextNode(tabStyleRule));
    }
    $('head').append(tabStyleSheet);
  }());

  // tab switch effects
  var contentTabsEffect = {
    none: {
      show: function(o) {
        o.tab.css({display:'block'});
        if(o.complete) o.complete();
      },
      hide: function(o) {
        o.tab.css({display:'none'});
        if(o.complete) o.complete();
      }
    },
    fade: {
      show: function(o) {
        if(o.fast) o.speed = 1;
        o.tab.fadeIn(o.speed);
        if(o.complete) setTimeout(o.complete, o.speed);
      },
      hide: function(o) {
        if(o.fast) o.speed = 1;
        o.tab.fadeOut(o.speed);
        if(o.complete) setTimeout(o.complete, o.speed);
      }
    },
    slide: {
      show: function(o) {
        var tabHeight = o.tab.show().css({width:o.tab.width()}).outerHeight(true);
        var tmpWrap = $('<div class="effect-div">').insertBefore(o.tab).append(o.tab);
        tmpWrap.css({width:'100%', overflow:'hidden', position:'relative'}); o.tab.css({marginTop:-tabHeight,display:'block'});
        if(o.fast) o.speed = 1;
        o.tab.animate({marginTop: 0}, {duration: o.speed, complete: function(){
          o.tab.css({marginTop: '', width: ''}).insertBefore(tmpWrap);
          tmpWrap.remove();
          if(o.complete) o.complete();
        }});
      },
      hide: function(o) {
        var tabHeight = o.tab.show().css({width:o.tab.width()}).outerHeight(true);
        var tmpWrap = $('<div class="effect-div">').insertBefore(o.tab).append(o.tab);
        tmpWrap.css({width:'100%', overflow:'hidden', position:'relative'});

        if(o.fast) o.speed = 1;
        o.tab.animate({marginTop: -tabHeight}, {duration: o.speed, complete: function(){
          o.tab.css({display:'none', marginTop:'', width:''}).insertBefore(tmpWrap);
          tmpWrap.remove();
          if(o.complete) o.complete();
        }});
      }
    }
  };
}(jQuery));

/*!
 * SmoothScroll module
 */
;(function($, exports) {
  // private variables
  var page,
    win = $(window),
    activeBlock, activeWheelHandler,
    wheelEvents = ('onwheel' in document || document.documentMode >= 9 ? 'wheel' : 'mousewheel DOMMouseScroll');

  // animation handlers
  function scrollTo(offset, options, callback) {
    // initialize variables
    var scrollBlock;
    if (document.body) {
      if (typeof options === 'number') {
        options = { duration: options };
      } else {
        options = options || {};
      }
      page = page || $('html, body');
      scrollBlock = options.container || page;
    } else {
      return;
    }

    // treat single number as scrollTop
    if (typeof offset === 'number') {
      offset = { top: offset };
    }

    // handle mousewheel/trackpad while animation is active
    if (activeBlock && activeWheelHandler) {
      activeBlock.off(wheelEvents, activeWheelHandler);
    }
    if (options.wheelBehavior && options.wheelBehavior !== 'none') {
      activeWheelHandler = function(e) {
        if (options.wheelBehavior === 'stop') {
          scrollBlock.off(wheelEvents, activeWheelHandler);
          scrollBlock.stop();
        } else if (options.wheelBehavior === 'ignore') {
          e.preventDefault();
        }
      };
      activeBlock = scrollBlock.on(wheelEvents, activeWheelHandler);
    }

    // start scrolling animation
    scrollBlock.stop().animate({
      scrollLeft: offset.left,
      scrollTop: offset.top
    }, options.duration, function() {
      if (activeWheelHandler) {
        scrollBlock.off(wheelEvents, activeWheelHandler);
      }
      if ($.isFunction(callback)) {
        callback();
      }
    });
  }

  // smooth scroll contstructor
  function SmoothScroll(options) {
    this.options = $.extend({
      anchorLinks: 'a[href^="#"]',  // selector or jQuery object
      container: null,    // specify container for scrolling (default - whole page)
      extraOffset: null,    // function or fixed number
      activeClasses: null,  // null, "link", "parent"
      easing: 'swing',    // easing of scrolling
      animMode: 'duration', // or "speed" mode
      animDuration: 800,    // total duration for scroll (any distance)
      animSpeed: 1500,    // pixels per second
      anchorActiveClass: 'anchor-active',
      sectionActiveClass: 'section-active',
      wheelBehavior: 'stop', // "stop", "ignore" or "none"
      useNativeAnchorScrolling: false // do not handle click in devices with native smooth scrolling
    }, options);
    this.init();
  }
  SmoothScroll.prototype = {
    init: function() {
      this.initStructure();
      this.attachEvents();
    },
    initStructure: function() {
      this.container = this.options.container ? $(this.options.container) : $('html,body');
      this.scrollContainer = this.options.container ? this.container : win;
      this.anchorLinks = $(this.options.anchorLinks);
    },
    getAnchorTarget: function(link) {
      // get target block from link href
      var targetId = $(link).attr('href');
      return $(targetId.length > 1 ? targetId : 'html');
    },
    getTargetOffset: function(block) {
      // get target offset
      var blockOffset = block.offset().top;
      if (this.options.container) {
        blockOffset -= this.container.offset().top - this.container.prop('scrollTop');
      }

      // handle extra offset
      if (typeof this.options.extraOffset === 'number') {
        blockOffset -= this.options.extraOffset;
      } else if (typeof this.options.extraOffset === 'function') {
        blockOffset -= this.options.extraOffset(block);
      }
      return { top: blockOffset };
    },
    attachEvents: function() {
      var self = this;

      // handle active classes
      if (this.options.activeClasses) {
        // cache structure
        this.anchorData = [];
        this.anchorLinks.each(function() {
          var link = jQuery(this),
            targetBlock = self.getAnchorTarget(link),
            anchorDataItem;

          $.each(self.anchorData, function(index, item) {
            if (item.block[0] === targetBlock[0]) {
              anchorDataItem = item;
            }
          });

          if (anchorDataItem) {
            anchorDataItem.link = anchorDataItem.link.add(link);
          } else {
            self.anchorData.push({
              link: link,
              block: targetBlock
            });
          }
        });

        // add additional event handlers
        this.resizeHandler = function() {
          self.recalculateOffsets();
        };
        this.scrollHandler = function() {
          self.refreshActiveClass();
        };

        this.recalculateOffsets();
        this.scrollContainer.on('scroll', this.scrollHandler);
        win.on('resize', this.resizeHandler);
      }

      // handle click event
      this.clickHandler = function(e) {
        self.onClick(e);
      };
      if (!this.options.useNativeAnchorScrolling) {
        this.anchorLinks.on('click', this.clickHandler);
      }
    },
    recalculateOffsets: function() {
      var self = this;
      $.each(this.anchorData, function(index, data) {
        data.offset = self.getTargetOffset(data.block);
        data.height = data.block.outerHeight();
      });
      this.refreshActiveClass();
    },
    refreshActiveClass: function() {
      var self = this,
        foundFlag = false,
        containerHeight = this.container.prop('scrollHeight'),
        viewPortHeight = this.scrollContainer.height(),
        scrollTop = this.options.container ? this.container.prop('scrollTop') : win.scrollTop();

      // user function instead of default handler
      if (this.options.customScrollHandler) {
        this.options.customScrollHandler.call(this, scrollTop, this.anchorData);
        return;
      }

      // sort anchor data by offsets
      this.anchorData.sort(function(a, b) {
        return a.offset.top - b.offset.top;
      });
      function toggleActiveClass(anchor, block, state) {
        anchor.toggleClass(self.options.anchorActiveClass, state);
        block.toggleClass(self.options.sectionActiveClass, state);
      }

      // default active class handler
      $.each(this.anchorData, function(index) {
        var reverseIndex = self.anchorData.length - index - 1,
          data = self.anchorData[reverseIndex],
          anchorElement = (self.options.activeClasses === 'parent' ? data.link.parent() : data.link);

        if (scrollTop >= containerHeight - viewPortHeight) {
          // handle last section
          if (reverseIndex === self.anchorData.length - 1) {
            toggleActiveClass(anchorElement, data.block, true);
          } else {
            toggleActiveClass(anchorElement, data.block, false);
          }
        } else {
          // handle other sections
          if (!foundFlag && (scrollTop >= data.offset.top - 1 || reverseIndex === 0)) {
            foundFlag = true;
            toggleActiveClass(anchorElement, data.block, true);
          } else {
            toggleActiveClass(anchorElement, data.block, false);
          }
        }
      });
    },
    calculateScrollDuration: function(offset) {
      var distance;
      if (this.options.animMode === 'speed') {
        distance = Math.abs(this.scrollContainer.scrollTop() - offset.top);
        return (distance / this.options.animSpeed) * 1000;
      } else {
        return this.options.animDuration;
      }
    },
    onClick: function(e) {
      var targetBlock = this.getAnchorTarget(e.currentTarget),
        targetOffset = this.getTargetOffset(targetBlock);

      e.preventDefault();
      scrollTo(targetOffset, {
        container: this.container,
        wheelBehavior: this.options.wheelBehavior,
        duration: this.calculateScrollDuration(targetOffset)
      });
    },
    destroy: function() {
      if (this.options.activeClasses) {
        win.off('resize', this.resizeHandler);
        this.scrollContainer.off('scroll', this.scrollHandler);
      }
      this.anchorLinks.off('click', this.clickHandler);
    }
  };

  // public API
  $.extend(SmoothScroll, {
    scrollTo: function(blockOrOffset, durationOrOptions, callback) {
      scrollTo(blockOrOffset, durationOrOptions, callback);
    }
  });

  // export module
  exports.SmoothScroll = SmoothScroll;
}(jQuery, this));


/*! WOW - v1.1.2 - 2015-08-19
* Copyright (c) 2015 Matthieu Aussaguel; Licensed MIT */(function(){var a,b,c,d,e,f=function(a,b){return function(){return a.apply(b,arguments)}},g=[].indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(b in this&&this[b]===a)return b;return-1};b=function(){function a(){}return a.prototype.extend=function(a,b){var c,d;for(c in b)d=b[c],null==a[c]&&(a[c]=d);return a},a.prototype.isMobile=function(a){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(a)},a.prototype.createEvent=function(a,b,c,d){var e;return null==b&&(b=!1),null==c&&(c=!1),null==d&&(d=null),null!=document.createEvent?(e=document.createEvent("CustomEvent"),e.initCustomEvent(a,b,c,d)):null!=document.createEventObject?(e=document.createEventObject(),e.eventType=a):e.eventName=a,e},a.prototype.emitEvent=function(a,b){return null!=a.dispatchEvent?a.dispatchEvent(b):b in(null!=a)?a[b]():"on"+b in(null!=a)?a["on"+b]():void 0},a.prototype.addEvent=function(a,b,c){return null!=a.addEventListener?a.addEventListener(b,c,!1):null!=a.attachEvent?a.attachEvent("on"+b,c):a[b]=c},a.prototype.removeEvent=function(a,b,c){return null!=a.removeEventListener?a.removeEventListener(b,c,!1):null!=a.detachEvent?a.detachEvent("on"+b,c):delete a[b]},a.prototype.innerHeight=function(){return"innerHeight"in window?window.innerHeight:document.documentElement.clientHeight},a}(),c=this.WeakMap||this.MozWeakMap||(c=function(){function a(){this.keys=[],this.values=[]}return a.prototype.get=function(a){var b,c,d,e,f;for(f=this.keys,b=d=0,e=f.length;e>d;b=++d)if(c=f[b],c===a)return this.values[b]},a.prototype.set=function(a,b){var c,d,e,f,g;for(g=this.keys,c=e=0,f=g.length;f>e;c=++e)if(d=g[c],d===a)return void(this.values[c]=b);return this.keys.push(a),this.values.push(b)},a}()),a=this.MutationObserver||this.WebkitMutationObserver||this.MozMutationObserver||(a=function(){function a(){"undefined"!=typeof console&&null!==console&&console.warn("MutationObserver is not supported by your browser."),"undefined"!=typeof console&&null!==console&&console.warn("WOW.js cannot detect dom mutations, please call .sync() after loading new content.")}return a.notSupported=!0,a.prototype.observe=function(){},a}()),d=this.getComputedStyle||function(a){return this.getPropertyValue=function(b){var c;return"float"===b&&(b="styleFloat"),e.test(b)&&b.replace(e,function(a,b){return b.toUpperCase()}),(null!=(c=a.currentStyle)?c[b]:void 0)||null},this},e=/(\-([a-z]){1})/g,this.WOW=function(){function e(a){null==a&&(a={}),this.scrollCallback=f(this.scrollCallback,this),this.scrollHandler=f(this.scrollHandler,this),this.resetAnimation=f(this.resetAnimation,this),this.start=f(this.start,this),this.scrolled=!0,this.config=this.util().extend(a,this.defaults),null!=a.scrollContainer&&(this.config.scrollContainer=document.querySelector(a.scrollContainer)),this.animationNameCache=new c,this.wowEvent=this.util().createEvent(this.config.boxClass)}return e.prototype.defaults={boxClass:"wow",animateClass:"animated",offset:0,mobile:!0,live:!0,callback:null,scrollContainer:null},e.prototype.init=function(){var a;return this.element=window.document.documentElement,"interactive"===(a=document.readyState)||"complete"===a?this.start():this.util().addEvent(document,"DOMContentLoaded",this.start),this.finished=[]},e.prototype.start=function(){var b,c,d,e;if(this.stopped=!1,this.boxes=function(){var a,c,d,e;for(d=this.element.querySelectorAll("."+this.config.boxClass),e=[],a=0,c=d.length;c>a;a++)b=d[a],e.push(b);return e}.call(this),this.all=function(){var a,c,d,e;for(d=this.boxes,e=[],a=0,c=d.length;c>a;a++)b=d[a],e.push(b);return e}.call(this),this.boxes.length)if(this.disabled())this.resetStyle();else for(e=this.boxes,c=0,d=e.length;d>c;c++)b=e[c],this.applyStyle(b,!0);return this.disabled()||(this.util().addEvent(this.config.scrollContainer||window,"scroll",this.scrollHandler),this.util().addEvent(window,"resize",this.scrollHandler),this.interval=setInterval(this.scrollCallback,50)),this.config.live?new a(function(a){return function(b){var c,d,e,f,g;for(g=[],c=0,d=b.length;d>c;c++)f=b[c],g.push(function(){var a,b,c,d;for(c=f.addedNodes||[],d=[],a=0,b=c.length;b>a;a++)e=c[a],d.push(this.doSync(e));return d}.call(a));return g}}(this)).observe(document.body,{childList:!0,subtree:!0}):void 0},e.prototype.stop=function(){return this.stopped=!0,this.util().removeEvent(this.config.scrollContainer||window,"scroll",this.scrollHandler),this.util().removeEvent(window,"resize",this.scrollHandler),null!=this.interval?clearInterval(this.interval):void 0},e.prototype.sync=function(){return a.notSupported?this.doSync(this.element):void 0},e.prototype.doSync=function(a){var b,c,d,e,f;if(null==a&&(a=this.element),1===a.nodeType){for(a=a.parentNode||a,e=a.querySelectorAll("."+this.config.boxClass),f=[],c=0,d=e.length;d>c;c++)b=e[c],g.call(this.all,b)<0?(this.boxes.push(b),this.all.push(b),this.stopped||this.disabled()?this.resetStyle():this.applyStyle(b,!0),f.push(this.scrolled=!0)):f.push(void 0);return f}},e.prototype.show=function(a){return this.applyStyle(a),a.className=a.className+" "+this.config.animateClass,null!=this.config.callback&&this.config.callback(a),this.util().emitEvent(a,this.wowEvent),this.util().addEvent(a,"animationend",this.resetAnimation),this.util().addEvent(a,"oanimationend",this.resetAnimation),this.util().addEvent(a,"webkitAnimationEnd",this.resetAnimation),this.util().addEvent(a,"MSAnimationEnd",this.resetAnimation),a},e.prototype.applyStyle=function(a,b){var c,d,e;return d=a.getAttribute("data-wow-duration"),c=a.getAttribute("data-wow-delay"),e=a.getAttribute("data-wow-iteration"),this.animate(function(f){return function(){return f.customStyle(a,b,d,c,e)}}(this))},e.prototype.animate=function(){return"requestAnimationFrame"in window?function(a){return window.requestAnimationFrame(a)}:function(a){return a()}}(),e.prototype.resetStyle=function(){var a,b,c,d,e;for(d=this.boxes,e=[],b=0,c=d.length;c>b;b++)a=d[b],e.push(a.style.visibility="visible");return e},e.prototype.resetAnimation=function(a){var b;return a.type.toLowerCase().indexOf("animationend")>=0?(b=a.target||a.srcElement,b.className=b.className.replace(this.config.animateClass,"").trim()):void 0},e.prototype.customStyle=function(a,b,c,d,e){return b&&this.cacheAnimationName(a),a.style.visibility=b?"hidden":"visible",c&&this.vendorSet(a.style,{animationDuration:c}),d&&this.vendorSet(a.style,{animationDelay:d}),e&&this.vendorSet(a.style,{animationIterationCount:e}),this.vendorSet(a.style,{animationName:b?"none":this.cachedAnimationName(a)}),a},e.prototype.vendors=["moz","webkit"],e.prototype.vendorSet=function(a,b){var c,d,e,f;d=[];for(c in b)e=b[c],a[""+c]=e,d.push(function(){var b,d,g,h;for(g=this.vendors,h=[],b=0,d=g.length;d>b;b++)f=g[b],h.push(a[""+f+c.charAt(0).toUpperCase()+c.substr(1)]=e);return h}.call(this));return d},e.prototype.vendorCSS=function(a,b){var c,e,f,g,h,i;for(h=d(a),g=h.getPropertyCSSValue(b),f=this.vendors,c=0,e=f.length;e>c;c++)i=f[c],g=g||h.getPropertyCSSValue("-"+i+"-"+b);return g},e.prototype.animationName=function(a){var b;try{b=this.vendorCSS(a,"animation-name").cssText}catch(c){b=d(a).getPropertyValue("animation-name")}return"none"===b?"":b},e.prototype.cacheAnimationName=function(a){return this.animationNameCache.set(a,this.animationName(a))},e.prototype.cachedAnimationName=function(a){return this.animationNameCache.get(a)},e.prototype.scrollHandler=function(){return this.scrolled=!0},e.prototype.scrollCallback=function(){var a;return!this.scrolled||(this.scrolled=!1,this.boxes=function(){var b,c,d,e;for(d=this.boxes,e=[],b=0,c=d.length;c>b;b++)a=d[b],a&&(this.isVisible(a)?this.show(a):e.push(a));return e}.call(this),this.boxes.length||this.config.live)?void 0:this.stop()},e.prototype.offsetTop=function(a){for(var b;void 0===a.offsetTop;)a=a.parentNode;for(b=a.offsetTop;a=a.offsetParent;)b+=a.offsetTop;return b},e.prototype.isVisible=function(a){var b,c,d,e,f;return c=a.getAttribute("data-wow-offset")||this.config.offset,f=this.config.scrollContainer&&this.config.scrollContainer.scrollTop||window.pageYOffset,e=f+Math.min(this.element.clientHeight,this.util().innerHeight())-c,d=this.offsetTop(a),b=d+a.clientHeight,e>=d&&b>=f},e.prototype.util=function(){return null!=this._util?this._util:this._util=new b},e.prototype.disabled=function(){return!this.config.mobile&&this.util().isMobile(navigator.userAgent)},e}()}).call(this);