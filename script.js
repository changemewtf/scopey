function build(tag, options) {
  var element = document.createElement(tag),
      copy    = (k,v) => element[k] = v,
      recipes = {
        className:   copy,
        id:          copy,
        contains:    (k,v) => { v.forEach((c) => element.appendChild(c)) },
        text:        (k,v) => { element.textContent = v },
        textContent: copy,
        onclick:     copy
      };

  for (var k in recipes) {
    if(options[k]) { recipes[k](k, options[k]); }
  }
  return element;
}

/*
 * Slides
 *
 * Displays documents on the page.
 *
 * Call initialize() to get started.
 *
 **/

var Slides = {
  slides: [],
  element: null,

  initialize: function() {
    this.slides = data["slides"];
    this.element = document.getElementById("slides");
    this.slides.forEach(this.buildSlide.bind(this));

    Editor.initialize();
    TooltipManager.initialize();
  },

  buildSlide: function(slide) {
    if(slide.saved) {
      var section = Serializer.rebuild(slide.saved);
    } else {
      var section = build("section", {className: "code"});
      slide.code.split("\n").forEach(function(line) {
        section.innerHTML += '<p class="line">' + line + '</p>';
      });
    }
    this.element.appendChild(section);
  },

  appendControls: function(controls) {
    this.element.appendChild(controls);
  }
};

var Serializer = {
  rebuild: function(saved) {
    if(saved.tag) { var n = document.createElement(saved.tag); }
    else if(saved.data) { var n = document.createTextNode(saved.data); }
    if(saved.class) { n.className = saved.class; }
    saved.children.forEach((c) => n.appendChild(this.rebuild(c)));
    if(saved.definition) { TooltipManager.watch(n, saved.definition); }
    return n;
  }
};


/*
 * Editor
 *
 * Enable live creation of new definition Words.
 *
 **/

var Editor = {
  initialize: function() {
    this.buildControls();
    Slides.appendControls(this.defControls);
  },

  addDefinition: function(event) {
    var elWord = build("span", {className: "word"});
    NodeChirurgeon.wrapSelection(elWord, document.getSelection());
    TooltipManager.watch(elWord, this.defInput.value);
    this.defInput.value = "";
  },

  buildControls: function() {
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

  initialize: function() {
    this.element = document.getElementById("tooltip");
  },

  watch: function(element, definition) {
    element.addEventListener("mouseover", (event) => {
      if(!event.firstCaughtBy) { event.firstCaughtBy = element; }
      this.pushTooltip(
        AlignedWord.buildElement(event.firstCaughtBy, element),
        definition
      );
    }, true);

    element.addEventListener("mouseout", this.popTooltip.bind(this), true);
  },

  pushTooltip: function(elWord, definition) {
    this.element.appendChild(
      build("div", {
        className: "tooltip",
        contains: [
          build("div", {className: "word", contains: [elWord]}),
          build("div", {className: "definition", text: definition})
        ]
      })
    );
  },

  popTooltip: function(event) {
    return this.element.removeChild(this.element.lastChild);
  }
};


/*
 * AlignedWord
 *
 * Creates horizontally aligned nested Tooltips by reproducing their entire
 * node tree ancestry. For example:
 *
 * ACTUAL TOOLTIP CONTENTS:
 *
 * console.log(generateMessage(data));    <-- outer
 * console.log(generateMessage(data));
 * console.log(generateMessage(data));    <-- target
 *
 * But each Word gets its own element, and we can use color: transparent
 * to hide the text of ancestors in the Tooltip for a given Word, so the
 * Tooltips end up looking like this:
 *
 * APPARENT TOOLTIP CONTENTS:
 *
 * console.log(generateMessage(data));    <-- outer
 *             generateMessage(data)
 *                             data       <-- target
 **/

var AlignedWord = {
  buildElement: function(outer, target) {
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
 * Given the following selection on a <p> with one text node child,
 * and a wrapper <span></span>:
 *                  ___________
 * <p> "console.log(myAdminCred);" </p>
 *
 * The Chirurgeon will produce:
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
  wrapSelection: function(wrapper, selection) {
    var [start, end] = Scalpel.makeBoundaryIncisions(selection);
    Suture.transplantNodes(wrapper, start, end);
  }
};

var Scalpel = {
  makeBoundaryIncisions: function(selection) {
    var start = this.cut(selection.anchorNode, selection.anchorOffset);
    var end = this.cut(selection.focusNode, selection.focusOffset);
    if(this.userDraggedRightToLeft(start, end)) {
      return [end, start];
    } else {
      return [start, end];
    }
  },

  cut: function(node, cutIndex) {
    if(cutIndex > 0 && cutIndex < node.length) {
      // selected in the middle: Hello[, world!]
      return node.splitText(cutIndex);
    } else {
      // selected at a boundary: [Hello, world!]
      return node;
    }
  },

  userDraggedRightToLeft: function(a, b) {
    // http://stackoverflow.com/a/23512678/16034
    return a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_PRECEDING;
  }
};

var Suture = {
  transplantNodes: function(newParent, start, end) {
    // Insert the new parent first, before we mess with the DOM.
    start.parentNode.insertBefore(newParent, start);
    // Transplant all siblings between start & end to the new parent.
    this.walkSiblings(start, end, (node) => newParent.appendChild(node));
  },

  walkSiblings: function(start, end, callback) {
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
