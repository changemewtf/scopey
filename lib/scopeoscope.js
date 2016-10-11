/*
 * build
 *
 * Convenience function for creating new DOM nodes.
 *
 **/

function build(tag, options) {
  var element = document.createElement(tag),
      copy    = (k,v) => element[k] = v,
      recipes = {
        className:   copy,
        id:          copy,
        contains:    (k,v) => { v.forEach((c) => element.appendChild(c)) },
        text:        (k,v) => { element.textContent = v },
        class:       (k,v) => { element.className = v },
        textContent: copy,
        onclick:     copy
      };

  for (var k in recipes) {
    if(options[k]) { recipes[k](k, options[k]); }
  }
  return element;
}


/*
 * ajax
 *
 * Convenience function for dealing with asynchronous requests.
 *
 **/

function ajax(url, data){
  var xhr = new XMLHttpRequest();
  xhr.onReadyStateChange = function() {
    if(xhr.readyState === XMLHttpRequest.DONE) {
      if(xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        console.log(response);
      }
    }
  }
  xhr.open('POST', url, true);
  xhr.send(JSON.stringify(data));
}


/*
 * Slides
 *
 * Displays documents on the page.
 *
 * initialize() is called from the document to get things started.
 *
 **/

var Slides = {
  slides: [],
  element: null,

  slideAttr: "data-slide-index",

  initialize() {
    this.slides = data["slides"];
    this.element = document.getElementById("slides");
    this.slides.forEach(this.buildSlide.bind(this));
  },

  buildSlide(slide, index) {
    if(slide.saved) {
      var section = Serializer.rebuild(slide.saved);
    } else {
      var section = build("section", {className: "code"});
      slide.code.split("\n").forEach(function(line) {
        section.innerHTML += '<p class="line">' + line + '</p>';
      });
    }
    section.setAttribute(this.slideAttr, index);
    this.element.appendChild(section);
  },

  /*
   * addWord
   *
   * Creates a tooltip listener for a given word/definition combo.
   * Optionally saves the definition to the server. (TODO not implemented yet)
   *
   **/

  addWord(elWord, definition, save=true) {
    // XXX decouple from TooltipManager
    TooltipManager.watch(elWord, definition);
    elWord.definition = definition;
    if(save) this.update(elWord);
  },

  update(elWord) {
    var elSlide = this.findSlide(elWord),
        index   = elSlide.getAttribute(this.slideAttr),
        slide   = this.slides[index];
    slide.saved = Serializer.save(elSlide);
    this.sync();
  },

  sync(data, index) {
    ajax("/save", this.slides);
  },

  findSlide(el) {
    if(el.hasAttribute(this.slideAttr)) return el;
    else return this.findSlide(el.parentNode);
  },

  appendControls(controls) {
    this.element.appendChild(controls);
  }
};

/*
 * Serializer
 *
 * Saves and loads slides into Plain Old JavaScript Objects.
 *
 **/

var Serializer = {
  rebuild(saved, index) {
    if(saved.tag) var n = document.createElement(saved.tag);
    else if(saved.data) var n = document.createTextNode(saved.data);
    if(saved.class) n.className = saved.class;
    saved.children.forEach((c) => n.appendChild(this.rebuild(c)));
    if(saved.definition) Slides.addWord(n, saved.definition, false);
    return n;
  },

  save(node) {
    return {
      tag: node.tagName,
      class: node.className,
      definition: node.definition,
      data: node.data,
      children: node.childNodes.map((n) => this.save(n))
    };
  }
};


/*
 * Editor
 *
 * Enable live creation of new definition Words.
 *
 **/

var Editor = {
  initialize() {
    this.buildControls();
    Slides.appendControls(this.defControls);
  },

  addDefinition(event) {
    var elWord = build("span", {className: "word"}),
        definition = this.defInput.value;
    NodeChirurgeon.wrapSelection(elWord, document.getSelection());
    Slides.addWord(elWord, definition);
    this.defInput.value = "";
  },

  buildControls() {
    this.defButton   = build("button", {
                         id: "add-definition",
                         textContent: "Define",
                         onclick: this.addDefinition.bind(this)
                       });
    this.defInput    = build("input", {
                         id: "write-definition"
                       });
    this.defControls = build("div", {
                         id: "definition-controls",
                         contains: [this.defInput, this.defButton]
                       });
  }
};


/*
 * TooltipManager
 *
 * Given an element and a definition, make a hover popup for the element.
 *
 * By passing true to Element.addEventListener(), we cause element to listen
 * in "capture" mode, which means the callback will be triggered as the event
 * descends down the hierarchy rather than on its way back up.
 *
 * console.log(generateMessage(data));  |  1  <- firstCaughtBy
 *             generateMessage(data)    |  2
 *                             data     V  3
 *
 * This allows us to generate tooltips in order "on the way down", without
 * ever having to keep track of the tooltips ourselves.
 *
 **/

var TooltipManager = {
  element: null,
  active: null,

  initialize() {
    this.element = document.getElementById("tooltip");
  },

  watch(element, definition) {
    element.addEventListener("mouseover", (event) => {
      if(!event.firstCaughtBy) { event.firstCaughtBy = element; }
      this.push(element, definition, event.firstCaughtBy);
    }, true);

    element.addEventListener("mouseout", (event) => {
      this.pop(element);
    }, true);
  },

  push(element, definition, elOuter) {
    this.element.appendChild(
      this.build(
        AlignedWord.buildElement(element, elOuter),
        definition
      )
    );
    this.setActive(element);
  },

  pop(element) {
    this.element.removeChild(this.element.lastChild);
    this.setActive(null);
  },

  setActive(element) {
    if(this.active) { this.active.classList.remove("active"); }
    if(element) {
      this.active = element;
      element.classList.add("active");
    } else {
      this.active = null;
    }
  },

  build(elWord, definition) {
    return build("div", {
      className: "tooltip",
      contains: [
        build("div", {className: "word", contains: [elWord]}),
        build("div", {className: "definition", text: definition})
      ]
    })
  }
};


/*
 * AlignedWord
 *
 * Creates horizontally aligned nested Tooltips by reproducing their entire
 * node ancestry. For example:
 *
 * ACTUAL TOOLTIP CONTENTS:
 *
 * console.log(generateMessage(data));    <-- outer
 * console.log(generateMessage(data));
 * console.log(generateMessage(data));    <-- mouseover target
 *
 * Each Word gets its own element, and we use color: transparent to hide the
 * text of ancestors in the Tooltip for a given Word, so the Tooltips end up
 * looking like this:
 *
 * VISIBLE TOOLTIP CONTENTS:
 *
 * console.log(generateMessage(data));    <-- outer
 *             generateMessage(data)
 *                             data       <-- mouseover target
 **/

var AlignedWord = {
  buildElement(target, outer) {
    return deepCopy(outer, function(copy, original) {
      if(original === target) {
        copy.className += " shown";
      }
    });
  }
};

function deepCopy(original, editClone) {
  // copy classes, IDs, but not child text or elements
  var copy = original.cloneNode();
  editClone(copy, original);
  original.childNodes.forEach(function(child) {
    copy.appendChild(deepCopy(child, editClone));
  });
  return copy;
}


/*
 * NodeChirurgeon
 *
 * Divide, extract, enclose, and transplant nodes with surgical accuracy.
 *
 * If you select a method call parameter within the text node of a <p> tag...
 *                  ___________
 * <p> "console.log(myAdminCred);" </p>
 *
 * Calling Chirurgeon.wrapSelection(<span></span>, selection) will produce:
 *
 * <p>
 *     "console.log("
 *     <span>
 *         "myAdminCred"
 *     </span>
 *     ");"
 * </p>
 *
 **/

var NodeChirurgeon = {
  wrapSelection(wrapper, selection) {
    var [start, end] = Scalpel.makeBoundaryIncisions(selection);
    Suture.transplantNodes(wrapper, start, end);
  }
};

/*
 * Scalpel
 *
 * If a selection begins or ends in the middle of a text node (such as in the
 * example above), the node must be split at the selection boundaries so the
 * actual selected text can be moved to the wrapper.
 *
 **/

var Scalpel = {
  makeBoundaryIncisions(selection) {
    var start = this.cut(selection.anchorNode, selection.anchorOffset),
        end   = this.cut(selection.focusNode, selection.focusOffset);

    // "anchor" and "focus" always correspond to "where the selection event
    // began" and "where the selection event ended", but we want to normalize
    // this to "left" and "right" so we can iterate sanely using nextSibling.

    if(this.userDraggedRightToLeft(start, end)) {
      return [end, start];
    } else {
      return [start, end];
    }
  },

  cut(node, cutIndex) {
    if(cutIndex > 0 && cutIndex < node.length) {
      // selected in the middle: Hello[, world!]
      return node.splitText(cutIndex);
    } else {
      // selected at a boundary: [Hello, world!]
      return node;
    }
  },

  userDraggedRightToLeft(a, b) {
    // http://stackoverflow.com/a/23512678/16034
    // XXX move this to Suture, which is the only code that actually
    // cares about the order
    return a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_PRECEDING;
  }
};

var Suture = {
  transplantNodes(newParent, start, end) {
    // Insert the new parent first, before we mess with the DOM.
    start.parentNode.insertBefore(newParent, start);
    // Transplant all siblings between start & end to the new parent.
    this.walkSiblings(start, end, (node) => newParent.appendChild(node));
  },

  walkSiblings(start, end, callback) {
    var cache, cursor = start;
    do {
      // cache the next sibling, since we're expecting to move
      // the cursor node around within the DOM hierarchy
      cache = cursor.nextSibling;
      callback(cursor);
      cursor = cache;
    } while (cursor != end);
  }
};

